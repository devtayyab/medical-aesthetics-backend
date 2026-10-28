import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Pre-launch auth hardening (items 6, 18):
 * - lockout + 2-step login code columns, accountSetupPending for staff-created accounts
 * - every EXISTING user counts as email-verified (nobody is locked out by the new check)
 * - emails lowercased; case-duplicates are only REPORTED (never deleted or merged)
 * - unique index on LOWER(email) when there are no case-duplicates left
 */
export class AuthHardeningAndLowercaseEmails1787610000000 implements MigrationInterface {
    name = 'AuthHardeningAndLowercaseEmails1787610000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginCodeHash" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginCodeExpiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginCodeSentAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginCodeAttempts" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountSetupPending" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean NOT NULL DEFAULT false`);

        // Existing accounts are trusted: email verification only applies to new registrations.
        await queryRunner.query(`UPDATE "users" SET "isEmailVerified" = true WHERE "isEmailVerified" = false`);

        // Report case-duplicates (e.g. Maria@x.gr and maria@x.gr). They are left untouched for manual review.
        const duplicates: Array<{ normalized: string; ids: string[]; emails: string[] }> = await queryRunner.query(`
            SELECT LOWER(TRIM("email")) AS normalized,
                   array_agg("id"::text ORDER BY "createdAt") AS ids,
                   array_agg("email" ORDER BY "createdAt") AS emails
            FROM "users"
            WHERE "email" IS NOT NULL
            GROUP BY LOWER(TRIM("email"))
            HAVING COUNT(*) > 1
        `);
        if (duplicates.length > 0) {
            console.warn(`[AuthHardeningAndLowercaseEmails] ${duplicates.length} email(s) exist more than once with different casing. NOT changed, please merge manually:`);
            for (const d of duplicates) {
                console.warn(`  ${d.normalized}: ${JSON.stringify(d.emails)} ids=${JSON.stringify(d.ids)}`);
            }
        }

        // Lowercase every email that does not collide with another account.
        await queryRunner.query(`
            UPDATE "users" u
            SET "email" = LOWER(TRIM(u."email"))
            WHERE u."email" IS NOT NULL
              AND u."email" <> LOWER(TRIM(u."email"))
              AND NOT EXISTS (
                  SELECT 1 FROM "users" o
                  WHERE o."id" <> u."id" AND LOWER(TRIM(o."email")) = LOWER(TRIM(u."email"))
              )
        `);

        if (duplicates.length === 0) {
            await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email_lower" ON "users" (LOWER("email"))`);
        } else {
            console.warn('[AuthHardeningAndLowercaseEmails] Skipped unique index on LOWER(email) because of the duplicates above. Create it after merging: CREATE UNIQUE INDEX "IDX_users_email_lower" ON "users" (LOWER("email"));');
        }

        // Report placeholder emails created by the old booking flow (item 18). Not changed.
        const placeholders = await queryRunner.query(`
            SELECT COUNT(*)::int AS count FROM "users"
            WHERE "email" ILIKE 'guest-%@example.com' OR "email" ILIKE 'temp-%@example.com'
        `);
        if (placeholders?.[0]?.count > 0) {
            console.warn(`[AuthHardeningAndLowercaseEmails] ${placeholders[0].count} user(s) still have a placeholder guest-/temp-...@example.com email. Add their real email from the CRM card.`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_lower"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "accountSetupPending"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginCodeAttempts"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginCodeSentAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "loginCodeHash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lockedUntil"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "failedLoginAttempts"`);
        // Lowercased emails and the verified flag are intentionally not reverted.
    }
}
