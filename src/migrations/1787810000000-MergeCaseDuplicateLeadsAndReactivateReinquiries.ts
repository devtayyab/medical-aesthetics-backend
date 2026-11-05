import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * QA #59 "Leads who re-submit a form": every submission belongs on ONE card.
 *
 * 1. Merge lead cards whose email is the same ignoring case/spaces (e.g. a re-submission
 *    typed as "Elpida@..." created a second card next to "elpida@..."):
 *    - the OLDEST card is kept; its form history gets every submission of the duplicates
 *      (de-duplicated by Facebook lead id), sorted by date;
 *    - the kept card takes the newest submission's email, phone, form and date (comes to top);
 *    - a Lost/Converted kept card becomes active again when a duplicate holds a newer submission;
 *    - tasks, CRM actions, communication logs, tags, owners, clinics and clinic statuses of
 *      the duplicates move to the kept card;
 *    - duplicates are soft-deleted (deletedAt) with status 'merged' and
 *      metadata.mergedIntoLeadId, so nothing is lost and Facebook re-imports stay deduplicated.
 * 2. Reactivate cards that re-submitted a form while Lost/Converted under the old code
 *    (which kept the status): status -> 'new', metadata.reactivatedAt set.
 * 3. Replace "Facebook Form <id>" placeholders with the real form name where another lead
 *    or form-history entry of the same form id carries it.
 *
 * Idempotent: merged duplicates are excluded by every query, reactivated cards carry
 * reactivatedAt, and healed names no longer match the placeholder pattern.
 * down() is a no-op: merged data is not split again (duplicates stay soft-deleted and
 * can be inspected/restored manually via metadata.mergedIntoLeadId).
 */
export class MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000 implements MigrationInterface {
  name = 'MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000';

  private static readonly CLOSED = ['lost', 'converted'];
  private static readonly ACTIVE_RANK: Record<string, number> = {
    new: 0,
    contacted: 1,
    follow_up: 2,
    qualified: 3,
    appointment_scheduled: 4,
  };
  private static readonly PLACEHOLDER = /^Facebook Form ([0-9]+)$/;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const merged = await this.mergeCaseDuplicates(queryRunner);
    const reactivated = await this.reactivateReinquiries(queryRunner);
    const healed = await this.healFormNames(queryRunner);
    console.log(
      `[MergeCaseDuplicateLeads] merged ${merged.duplicates} duplicate card(s) into ${merged.groups} card(s); ` +
        `reactivated ${reactivated} re-submitted Lost/Converted card(s); repaired form names on ${healed} card(s)`,
    );
  }

  public async down(): Promise<void> {
    // Data merge is not reversed (see class comment).
  }

  // ─── helpers ────────────────────────────────────────────────────────────

  private async tableHasColumn(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const rows = await qr.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    return rows.length > 0;
  }

  private time(v: any): number {
    if (!v) return 0;
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  private submittedAt(lead: any): number {
    return this.time(lead.lastMetaFormSubmittedAt) || this.time(lead.createdAt);
  }

  private meta(lead: any): any {
    const m = lead.metadata;
    if (!m) return {};
    if (typeof m === 'string') {
      try {
        return JSON.parse(m) || {};
      } catch {
        return {};
      }
    }
    return m;
  }

  /** The card's submissions: its stored form history, or one entry built from its columns. */
  private historyOf(lead: any): any[] {
    const m = this.meta(lead);
    if (Array.isArray(m.formHistory) && m.formHistory.length > 0) return m.formHistory;
    return [
      {
        formId: lead.facebookFormId || undefined,
        formName:
          lead.lastMetaFormName || (lead.facebookFormId ? `Facebook Form ${lead.facebookFormId}` : 'Initial entry'),
        adName: lead.facebookAdName || undefined,
        facebookLeadId: lead.facebookLeadId || undefined,
        submittedAt: lead.lastMetaFormSubmittedAt || lead.createdAt,
        firstName: lead.firstName || undefined,
        lastName: lead.lastName || undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        source: lead.source || undefined,
        leadData: lead.facebookLeadData || undefined,
      },
    ];
  }

  // ─── 1. merge duplicates that differ only by email case ──────────────────

  private async mergeCaseDuplicates(qr: QueryRunner): Promise<{ groups: number; duplicates: number }> {
    const groups: Array<{ norm: string }> = await qr.query(`
      SELECT LOWER(TRIM("email")) AS norm
      FROM "leads"
      WHERE "deletedAt" IS NULL
        AND LOWER("status") <> 'merged'
        AND "email" IS NOT NULL AND TRIM("email") <> ''
        AND "email" !~* '@example\\.com$'
      GROUP BY LOWER(TRIM("email"))
      HAVING COUNT(*) > 1
    `);
    if (groups.length === 0) return { groups: 0, duplicates: 0 };

    const has = {
      crmCustomer: await this.tableHasColumn(qr, 'crm_actions', 'customerId'),
      crmRelated: await this.tableHasColumn(qr, 'crm_actions', 'relatedLeadId'),
      commRelated: await this.tableHasColumn(qr, 'communication_logs', 'relatedLeadId'),
      tags: await this.tableHasColumn(qr, 'lead_tags', 'leadId'),
      owners: await this.tableHasColumn(qr, 'lead_owners', 'leadId'),
      clinics: await this.tableHasColumn(qr, 'lead_clinics', 'leadId'),
      clinicStatuses: await this.tableHasColumn(qr, 'lead_clinic_statuses', 'leadId'),
    };

    let duplicateCount = 0;
    for (const { norm } of groups) {
      const rows: any[] = await qr.query(
        `SELECT * FROM "leads"
         WHERE "deletedAt" IS NULL AND LOWER("status") <> 'merged' AND LOWER(TRIM("email")) = $1
         ORDER BY "createdAt" ASC, "id" ASC`,
        [norm],
      );
      if (rows.length < 2) continue;

      const keep = rows[0];
      const dups = rows.slice(1);
      const dupIds: string[] = dups.map((d) => d.id);
      const all = rows;
      const newest = all.reduce((a, b) => (this.submittedAt(b) > this.submittedAt(a) ? b : a), keep);

      // Form history: every submission once, oldest first
      const seen = new Set<string>();
      const history: any[] = [];
      for (const lead of all) {
        for (const entry of this.historyOf(lead)) {
          if (!entry) continue;
          const key = entry.facebookLeadId
            ? `fb:${entry.facebookLeadId}`
            : `f:${entry.formId || entry.formName || ''}:${this.time(entry.submittedAt)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          history.push(entry);
        }
      }
      history.sort((a, b) => this.time(a.submittedAt) - this.time(b.submittedAt));

      // Status
      const keepStatus = String(keep.status || 'new').toLowerCase();
      let status = keepStatus;
      if (MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000.CLOSED.includes(keepStatus) && newest.id !== keep.id) {
        // The newest card reflects the latest inquiry and the work done on it
        status = String(newest.status || 'new').toLowerCase();
      } else if (keepStatus === 'new') {
        const ranks = MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000.ACTIVE_RANK;
        for (const d of dups) {
          const ds = String(d.status || '').toLowerCase();
          if (ranks[ds] !== undefined && ranks[ds] > (ranks[status] ?? 0)) status = ds;
        }
      }
      const reactivated =
        MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000.CLOSED.includes(keepStatus) &&
        !MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000.CLOSED.includes(status);

      // Metadata: duplicates' keys fill gaps, the kept card's keys win
      const keepMeta = this.meta(keep);
      const dupMetas = dups.map((d) => this.meta(d));
      const baseMeta: any = {};
      for (const dm of dupMetas) Object.assign(baseMeta, dm);
      const currentFbId = newest.facebookLeadId || keep.facebookLeadId || null;
      const previousFbIds = new Set<string>();
      for (const m of [keepMeta, ...dupMetas]) {
        for (const id of Array.isArray(m.previousFacebookLeadIds) ? m.previousFacebookLeadIds : []) if (id) previousFbIds.add(String(id));
      }
      for (const lead of all) if (lead.facebookLeadId) previousFbIds.add(String(lead.facebookLeadId));
      for (const h of history) if (h?.facebookLeadId) previousFbIds.add(String(h.facebookLeadId));
      if (currentFbId) previousFbIds.delete(String(currentFbId));

      const lastSubmitted = new Date(this.submittedAt(newest));
      const metadata: any = {
        ...baseMeta,
        ...keepMeta,
        formHistory: history,
        previousFacebookLeadIds: [...previousFbIds],
        initialFormName: keepMeta.initialFormName || history[0]?.formName || keep.lastMetaFormName || undefined,
        initialSubmittedAt: keepMeta.initialSubmittedAt || history[0]?.submittedAt || keep.createdAt,
        mergedDuplicateLeadIds: [...new Set([...(keepMeta.mergedDuplicateLeadIds || []), ...dupIds])],
        mergedDuplicatesAt: new Date().toISOString(),
      };
      if (history.length > 1) {
        metadata.isRepeat = true;
        metadata.reInquiry = true;
        metadata.reInquiryCount = Math.max(Number(keepMeta.reInquiryCount || 0), history.length - 1);
        metadata.lastReInquiryDate = lastSubmitted.toISOString();
      }
      if (reactivated) {
        metadata.reactivatedAt = new Date().toISOString();
        metadata.reactivatedFrom = keepStatus;
      }

      const dupNotes = dups
        .filter((d) => d.notes && String(d.notes).trim())
        .map((d) => `[Merged duplicate card created ${new Date(d.createdAt).toISOString().slice(0, 10)}]: ${d.notes}`);
      const notes = [keep.notes, ...dupNotes].filter((n) => n && String(n).trim()).join('\n\n') || null;

      const pick = (field: string) => (newest[field] !== null && newest[field] !== undefined && newest[field] !== '' ? newest[field] : keep[field]);
      const firstNonNull = (field: string) => {
        if (keep[field] !== null && keep[field] !== undefined) return keep[field];
        for (const d of dups) if (d[field] !== null && d[field] !== undefined) return d[field];
        return null;
      };
      const maxTime = (field: string) => {
        let best: any = null;
        for (const l of all) if (l[field] && (!best || this.time(l[field]) > this.time(best))) best = l[field];
        return best;
      };
      const keepNameUsable = keep.firstName && keep.firstName !== 'Facebook';

      await qr.query(
        `UPDATE "leads" SET
           "status" = $2,
           "email" = $3,
           "phone" = $4,
           "firstName" = $5,
           "lastName" = $6,
           "assignedSalesId" = $7,
           "lastMetaFormSubmittedAt" = $8,
           "lastMetaFormName" = $9,
           "facebookLeadId" = $10,
           "facebookFormId" = $11,
           "facebookCampaignId" = $12,
           "facebookAdSetId" = $13,
           "facebookAdId" = $14,
           "facebookAdName" = $15,
           "notes" = $16,
           "metadata" = $17::json,
           "convertedAt" = $18,
           "lastContactedAt" = $19,
           "scheduledAt" = $20,
           "estimatedValue" = $21,
           "updatedAt" = now()
         WHERE "id" = $1`,
        [
          keep.id,
          status,
          String(newest.email || keep.email).trim(),
          pick('phone'),
          keepNameUsable ? keep.firstName : pick('firstName'),
          keep.lastName || pick('lastName'),
          firstNonNull('assignedSalesId'),
          lastSubmitted,
          pick('lastMetaFormName'),
          currentFbId,
          pick('facebookFormId'),
          pick('facebookCampaignId'),
          pick('facebookAdSetId'),
          pick('facebookAdId'),
          pick('facebookAdName'),
          notes,
          JSON.stringify(metadata),
          firstNonNull('convertedAt'),
          maxTime('lastContactedAt'),
          firstNonNull('scheduledAt'),
          firstNonNull('estimatedValue'),
        ],
      );

      // Move everything that hangs off the duplicates
      await qr.query(`UPDATE "tasks" SET "customerId" = $1 WHERE "customerId"::text = ANY($2::text[])`, [keep.id, dupIds]);
      if (has.crmCustomer) {
        await qr.query(`UPDATE "crm_actions" SET "customerId" = $1 WHERE "customerId"::text = ANY($2::text[])`, [keep.id, dupIds]);
      }
      if (has.crmRelated) {
        await qr.query(`UPDATE "crm_actions" SET "relatedLeadId" = $1 WHERE "relatedLeadId"::text = ANY($2::text[])`, [keep.id, dupIds]);
      }
      if (has.commRelated) {
        await qr.query(`UPDATE "communication_logs" SET "relatedLeadId" = $1 WHERE "relatedLeadId"::text = ANY($2::text[])`, [keep.id, dupIds]);
      }
      for (const [enabled, table, other] of [
        [has.tags, 'lead_tags', 'tagId'],
        [has.owners, 'lead_owners', 'userId'],
        [has.clinics, 'lead_clinics', 'clinicId'],
      ] as Array<[boolean, string, string]>) {
        if (!enabled) continue;
        await qr.query(
          `INSERT INTO "${table}" ("leadId", "${other}")
           SELECT DISTINCT $1::uuid, t."${other}" FROM "${table}" t
           WHERE t."leadId"::text = ANY($2::text[])
             AND NOT EXISTS (SELECT 1 FROM "${table}" x WHERE x."leadId" = $1::uuid AND x."${other}" = t."${other}")`,
          [keep.id, dupIds],
        );
        await qr.query(`DELETE FROM "${table}" WHERE "leadId"::text = ANY($1::text[])`, [dupIds]);
      }
      if (has.clinicStatuses) {
        // One status row per clinic: keep the kept card's, move the duplicates' others
        await qr.query(
          `UPDATE "lead_clinic_statuses" s SET "leadId" = $1
           WHERE s."leadId"::text = ANY($2::text[])
             AND NOT EXISTS (SELECT 1 FROM "lead_clinic_statuses" x WHERE x."leadId" = $1 AND x."clinicId" = s."clinicId")
             AND s."id" = (SELECT y."id" FROM "lead_clinic_statuses" y
                           WHERE y."leadId"::text = ANY($2::text[]) AND y."clinicId" = s."clinicId"
                           ORDER BY y."updatedAt" DESC LIMIT 1)`,
          [keep.id, dupIds],
        );
        await qr.query(`DELETE FROM "lead_clinic_statuses" WHERE "leadId"::text = ANY($1::text[])`, [dupIds]);
      }

      // Retire the duplicates (soft delete, traceable)
      for (const d of dups) {
        const dm = { ...this.meta(d), mergedIntoLeadId: keep.id, mergedAt: new Date().toISOString(), mergedReason: 'email-case-duplicate' };
        await qr.query(
          `UPDATE "leads" SET "status" = 'merged', "metadata" = $2::json, "deletedAt" = now(), "updatedAt" = now() WHERE "id" = $1`,
          [d.id, JSON.stringify(dm)],
        );
      }
      duplicateCount += dups.length;
    }
    return { groups: groups.length, duplicates: duplicateCount };
  }

  // ─── 2. reactivate re-submissions the old code left Lost/Converted ──────────

  private async reactivateReinquiries(qr: QueryRunner): Promise<number> {
    const rows: any[] = await qr.query(`
      SELECT "id", "status", "metadata", "convertedAt", "lastMetaFormSubmittedAt"
      FROM "leads"
      WHERE "deletedAt" IS NULL
        AND LOWER("status") IN ('lost', 'converted')
        AND "metadata" IS NOT NULL
        AND ("metadata"::jsonb ->> 'reInquiry') = 'true'
        AND ("metadata"::jsonb ->> 'reactivatedAt') IS NULL
    `);
    let count = 0;
    for (const r of rows) {
      const m = this.meta(r);
      const reInquiryAt = this.time(m.lastReInquiryDate) || this.time(r.lastMetaFormSubmittedAt);
      if (!reInquiryAt) continue;
      const status = String(r.status).toLowerCase();
      // Only when the card was closed BEFORE the re-submission (unknown close date = before)
      const closedAt = status === 'lost' ? this.time(m.lostAt) : this.time(r.convertedAt) || this.time(m.convertedAt);
      if (closedAt && closedAt >= reInquiryAt) continue;
      const next = { ...m, reactivatedAt: new Date().toISOString(), reactivatedFrom: status, reactivatedBy: 'migration' };
      await qr.query(`UPDATE "leads" SET "status" = 'new', "metadata" = $2::json, "updatedAt" = now() WHERE "id" = $1`, [
        r.id,
        JSON.stringify(next),
      ]);
      count++;
    }
    return count;
  }

  // ─── 3. "Facebook Form <id>" -> real form name ─────────────────────────────

  private async healFormNames(qr: QueryRunner): Promise<number> {
    const P = MergeCaseDuplicateLeadsAndReactivateReinquiries1787810000000.PLACEHOLDER;
    const names = new Map<string, string>();

    // Known names from cards (most frequent name per form id wins)
    const cardNames: Array<{ formId: string; name: string }> = await qr.query(`
      SELECT DISTINCT ON ("facebookFormId") "facebookFormId" AS "formId", "lastMetaFormName" AS name
      FROM (
        SELECT "facebookFormId", "lastMetaFormName", COUNT(*) AS c
        FROM "leads"
        WHERE "facebookFormId" IS NOT NULL AND "lastMetaFormName" IS NOT NULL
          AND "lastMetaFormName" !~ '^Facebook Form [0-9]+$' AND TRIM("lastMetaFormName") <> ''
        GROUP BY "facebookFormId", "lastMetaFormName"
      ) t
      ORDER BY "facebookFormId", c DESC
    `);
    for (const r of cardNames) if (r.formId && r.name) names.set(String(r.formId), r.name);

    // Known names from form-history entries
    const historyNames: Array<{ formId: string; name: string }> = await qr.query(`
      SELECT DISTINCT ON (h.entry ->> 'formId') h.entry ->> 'formId' AS "formId", h.entry ->> 'formName' AS name
      FROM "leads" l,
        LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(l."metadata"::jsonb -> 'formHistory') = 'array'
               THEN l."metadata"::jsonb -> 'formHistory' ELSE '[]'::jsonb END
        ) AS h(entry)
      WHERE h.entry ->> 'formId' IS NOT NULL AND h.entry ->> 'formName' IS NOT NULL
        AND h.entry ->> 'formName' !~ '^Facebook Form [0-9]+$'
        AND h.entry ->> 'formName' NOT IN ('Initial entry', 'Initial Form', 'New Form Submission', 'Form submission')
    `);
    for (const r of historyNames) if (r.formId && r.name && !names.has(String(r.formId))) names.set(String(r.formId), r.name);
    if (names.size === 0) return 0;

    const rows: any[] = await qr.query(`
      SELECT "id", "lastMetaFormName", "metadata" FROM "leads"
      WHERE "lastMetaFormName" ~ '^Facebook Form [0-9]+$'
         OR "metadata"::text ~ '"formName" *: *"Facebook Form [0-9]+"'
    `);
    let healed = 0;
    for (const r of rows) {
      let changed = false;
      let lastName = r.lastMetaFormName;
      const m1 = P.exec(lastName || '');
      if (m1 && names.has(m1[1])) {
        lastName = names.get(m1[1]);
        changed = true;
      }
      const meta = this.meta(r);
      let metaChanged = false;
      if (Array.isArray(meta.formHistory)) {
        meta.formHistory = meta.formHistory.map((h: any) => {
          const hm = P.exec(h?.formName || '');
          if (hm && names.has(hm[1])) {
            metaChanged = true;
            return { ...h, formName: names.get(hm[1]) };
          }
          return h;
        });
      }
      const im = P.exec(meta.initialFormName || '');
      if (im && names.has(im[1])) {
        meta.initialFormName = names.get(im[1]);
        metaChanged = true;
      }
      if (!changed && !metaChanged) continue;
      await qr.query(`UPDATE "leads" SET "lastMetaFormName" = $2, "metadata" = $3::json WHERE "id" = $1`, [
        r.id,
        lastName,
        metaChanged ? JSON.stringify(meta) : r.metadata === null ? null : JSON.stringify(this.meta(r)),
      ]);
      healed++;
    }
    return healed;
  }
}
