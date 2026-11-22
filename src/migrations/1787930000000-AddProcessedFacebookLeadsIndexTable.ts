import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates a compact, PK-indexed lookup table `processed_facebook_leads` holding every
 * Facebook lead ID ever ingested into the CRM (whether currently on `leads."facebookLeadId"`,
 * archived in `metadata.previousFacebookLeadIds`, or recorded inside `metadata.formHistory`).
 *
 * Replaces the 59-second full-table `leads.metadata::text / ::jsonb` scan that exceeded
 * PostgreSQL's 30s `statement_timeout` and stalled the 30-minute Facebook lead sync.
 */
export class AddProcessedFacebookLeadsIndexTable1787930000000 implements MigrationInterface {
  name = 'AddProcessedFacebookLeadsIndexTable1787930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Allow the one-time backfill over 30k+ JSON metadata rows to finish cleanly without hitting 30s timeout
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "processed_facebook_leads" (
        "facebookLeadId" varchar(128) NOT NULL,
        "leadId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_processed_facebook_leads" PRIMARY KEY ("facebookLeadId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_processed_facebook_leads_leadId"
      ON "processed_facebook_leads" ("leadId")
    `);

    // 1. Backfill direct facebookLeadId values (including soft-deleted leads so deleted leads are never re-imported)
    await queryRunner.query(`
      INSERT INTO "processed_facebook_leads" ("facebookLeadId", "leadId", "createdAt")
      SELECT DISTINCT ON ("facebookLeadId")
             "facebookLeadId",
             "id",
             COALESCE("lastMetaFormSubmittedAt", "createdAt", CURRENT_TIMESTAMP)
      FROM "leads"
      WHERE "facebookLeadId" IS NOT NULL
        AND TRIM("facebookLeadId") <> ''
      ORDER BY "facebookLeadId", "createdAt" ASC
      ON CONFLICT ("facebookLeadId") DO NOTHING
    `);

    // 2. Backfill archived previousFacebookLeadIds from metadata
    await queryRunner.query(`
      INSERT INTO "processed_facebook_leads" ("facebookLeadId", "leadId", "createdAt")
      SELECT DISTINCT ON (prev.fb_id)
             prev.fb_id,
             l.id,
             COALESCE(l."createdAt", CURRENT_TIMESTAMP)
      FROM "leads" l,
        LATERAL jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(l.metadata::jsonb -> 'previousFacebookLeadIds') = 'array'
               THEN l.metadata::jsonb -> 'previousFacebookLeadIds' ELSE '[]'::jsonb END
        ) AS prev(fb_id)
      WHERE l.metadata IS NOT NULL
        AND l.metadata::text LIKE '%previousFacebookLeadIds%'
        AND prev.fb_id IS NOT NULL
        AND TRIM(prev.fb_id) <> ''
      ORDER BY prev.fb_id, l."createdAt" ASC
      ON CONFLICT ("facebookLeadId") DO NOTHING
    `);

    // 3. Backfill formHistory[*].facebookLeadId from metadata
    await queryRunner.query(`
      INSERT INTO "processed_facebook_leads" ("facebookLeadId", "leadId", "createdAt")
      SELECT DISTINCT ON (hist.entry ->> 'facebookLeadId')
             hist.entry ->> 'facebookLeadId',
             l.id,
             COALESCE(l."createdAt", CURRENT_TIMESTAMP)
      FROM "leads" l,
        LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(l.metadata::jsonb -> 'formHistory') = 'array'
               THEN l.metadata::jsonb -> 'formHistory' ELSE '[]'::jsonb END
        ) AS hist(entry)
      WHERE l.metadata IS NOT NULL
        AND l.metadata::text LIKE '%formHistory%'
        AND hist.entry ->> 'facebookLeadId' IS NOT NULL
        AND TRIM(hist.entry ->> 'facebookLeadId') <> ''
      ORDER BY hist.entry ->> 'facebookLeadId', l."createdAt" ASC
      ON CONFLICT ("facebookLeadId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_processed_facebook_leads_leadId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "processed_facebook_leads"`);
  }
}
