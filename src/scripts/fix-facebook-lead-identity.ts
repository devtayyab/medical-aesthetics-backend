/**
 * Fills in name / phone / email of Facebook leads that were imported before the
 * Greek form fields ("Ονοματεπώνυμο", "Τηλέφωνο", "Κινητό", ...) were mapped.
 * The values are re-read from the raw Facebook answers stored on the lead
 * (facebookLeadData.field_data) with the same rules as the live import.
 *
 * Only EMPTY or placeholder values are filled ("", "Unknown", "Facebook",
 * "Lead <id>"); a value someone already typed is never overwritten.
 *
 * Optional --resolve-form-names also replaces "Facebook Form <id>" with the real
 * form name from the Graph API (uses the token from platform_settings or
 * FACEBOOK_ACCESS_TOKEN), on the card and in its form history.
 *
 * DRY RUN by default: prints every change and writes nothing.
 *
 *   npx ts-node -r tsconfig-paths/register src/scripts/fix-facebook-lead-identity.ts
 *   npx ts-node -r tsconfig-paths/register src/scripts/fix-facebook-lead-identity.ts --apply
 *   ... --apply --resolve-form-names
 */
import axios from 'axios';
import AppDataSource from '../config/data-source';
import { extractLeadIdentity } from '../modules/crm/facebook-lead-fields';

const PLACEHOLDER_FIRST = new Set(['', 'unknown', 'facebook', 'client']);

function isPlaceholderName(first?: string | null, last?: string | null): boolean {
  const f = (first || '').trim().toLowerCase();
  const l = (last || '').trim().toLowerCase();
  return PLACEHOLDER_FIRST.has(f) || (f === 'facebook' && l.startsWith('lead ')) || l === 'lead';
}

async function resolveFormNames(formIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  let token = process.env.FACEBOOK_ACCESS_TOKEN || '';
  try {
    const rows = await AppDataSource.query(
      `SELECT key, value FROM platform_settings WHERE key IN ('facebook_access_token', 'facebook_page_access_token')`,
    );
    const map: Record<string, any> = {};
    for (const r of rows) map[r.key] = typeof r.value === 'string' ? r.value : String(r.value ?? '');
    token = map['facebook_page_access_token'] || map['facebook_access_token'] || token;
  } catch {
    /* settings table unavailable: env token only */
  }
  if (!token) {
    console.warn('No Facebook token found: form names are left unchanged.');
    return names;
  }
  for (const id of formIds) {
    try {
      const res = await axios.get(`https://graph.facebook.com/v18.0/${id}`, { params: { access_token: token, fields: 'name' } });
      if (res.data?.name) names.set(id, res.data.name);
    } catch (err: any) {
      console.warn(`  form ${id}: ${err?.response?.data?.error?.message || err.message}`);
    }
  }
  return names;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const withFormNames = process.argv.includes('--resolve-form-names');

  AppDataSource.setOptions({ logging: false });
  await AppDataSource.initialize();

  try {
    console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no changes)'}`);

    const leads: any[] = await AppDataSource.query(
      `SELECT id, "firstName", "lastName", email, phone, "facebookLeadData", "facebookFormId", "lastMetaFormName", metadata
         FROM leads
        WHERE "deletedAt" IS NULL
          AND "facebookLeadData" IS NOT NULL
          AND (
            COALESCE(TRIM("firstName"), '') IN ('', 'Unknown', 'Facebook', 'Client')
            OR COALESCE(TRIM(phone), '') = ''
            OR COALESCE(TRIM(email), '') = ''
            OR "lastMetaFormName" LIKE 'Facebook Form %'
          )`,
    );
    console.log(`Facebook leads to check: ${leads.length}`);

    let formNames = new Map<string, string>();
    if (withFormNames) {
      const formIds = [
        ...new Set(
          leads
            .filter((l) => /^Facebook Form \d+/.test(l.lastMetaFormName || '') && l.facebookFormId)
            .map((l) => String(l.facebookFormId)),
        ),
      ];
      console.log(`Resolving ${formIds.length} form names from Facebook...`);
      formNames = await resolveFormNames(formIds);
    }

    let changed = 0;
    for (const lead of leads) {
      const raw = typeof lead.facebookLeadData === 'string' ? JSON.parse(lead.facebookLeadData) : lead.facebookLeadData;
      const identity = extractLeadIdentity(raw?.field_data || []);
      const patch: Record<string, any> = {};

      if (isPlaceholderName(lead.firstName, lead.lastName) && identity.firstName) {
        patch.firstName = identity.firstName;
        patch.lastName = identity.lastName || '';
      } else if (!String(lead.lastName || '').trim() && identity.lastName) {
        patch.lastName = identity.lastName;
      }
      if (!String(lead.phone || '').trim() && identity.phone) patch.phone = identity.phone;
      if (!String(lead.email || '').trim() && identity.email) {
        const taken = await AppDataSource.query(
          `SELECT 1 FROM leads WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1`,
          [identity.email, lead.id],
        );
        if (taken.length === 0) patch.email = identity.email;
      }

      const realFormName = lead.facebookFormId ? formNames.get(String(lead.facebookFormId)) : undefined;
      let metadata = lead.metadata;
      if (realFormName && /^Facebook Form \d+/.test(lead.lastMetaFormName || '')) {
        patch.lastMetaFormName = realFormName;
        const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata || {};
        if (Array.isArray(meta.formHistory)) {
          meta.formHistory = meta.formHistory.map((f: any) =>
            f && String(f.formId) === String(lead.facebookFormId) && /^Facebook Form \d+/.test(f.formName || '')
              ? { ...f, formName: realFormName }
              : f,
          );
          metadata = meta;
          patch.metadata = JSON.stringify(meta);
        }
      }

      if (Object.keys(patch).length === 0) continue;
      changed++;
      const shown = { ...patch };
      if (shown.metadata) shown.metadata = '(form history names updated)';
      console.log(`lead ${lead.id}: ${JSON.stringify({ firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, email: lead.email })} -> ${JSON.stringify(shown)}`);

      if (apply) {
        const cols = Object.keys(patch);
        const sets = cols.map((c, i) => (c === 'metadata' ? `metadata = $${i + 2}::json` : `"${c}" = $${i + 2}`));
        await AppDataSource.query(`UPDATE leads SET ${sets.join(', ')}, "updatedAt" = NOW() WHERE id = $1`, [
          lead.id,
          ...cols.map((c) => patch[c]),
        ]);
      }
    }

    console.log(`\n${changed} lead(s) ${apply ? 'updated' : 'would be updated'}.`);
    if (!apply) console.log('Dry run only. Re-run with --apply to write the changes.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Fix failed:', err);
  process.exit(1);
});
