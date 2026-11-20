import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1. Adds `isBeautyDoctorsMember` (boolean, default false) and `invitationSentAt` (timestamptz, nullable)
 *    to `users` so Beauty Doctors membership is persisted on the customer profile and account invitation
 *    emails are tracked and sent at most once per customer.
 * 2. Backfills all Fresha-imported appointments (`isBeautyDoctorsClient = true`, `appointmentSource = 'platform_broker'`)
 *    and marks their corresponding customers as Beauty Doctors Members (ensuring a `customer_records` row exists).
 * 3. Marks all existing Beauty Doctors clients (matching a CRM lead by phone/email, having a `customer_records` row,
 *    or having a Beauty Doctors booking) as `isBeautyDoctorsMember = true`, and fixes misclassified appointments
 *    for those members (e.g. booked by secretariat for an existing BD lead/client).
 * 4. Populates missing `appointments."clientDetails"` JSON from the linked `users` record.
 */
export class ClientRecognitionAndInvitationControls1787910000000 implements MigrationInterface {
    name = 'ClientRecognitionAndInvitationControls1787910000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add user columns
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isBeautyDoctorsMember" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitationSentAt" TIMESTAMP WITH TIME ZONE`,
        );

        // 2. Update all Fresha-imported appointments to isBeautyDoctorsClient = true
        await queryRunner.query(`
            UPDATE "appointments"
            SET "isBeautyDoctorsClient" = true,
                "appointmentSource" = 'platform_broker'
            WHERE COALESCE("notes", '') ~* '^\\s*(απ[όο]|from)\\s+fresha\\b'
               OR COALESCE("notes", '') ILIKE '%fresha%'
        `);

        // 3. Mark customers linked to Fresha appointments as Beauty Doctors Members
        await queryRunner.query(`
            UPDATE "users" u
            SET "isBeautyDoctorsMember" = true
            WHERE u.role = 'client'
              AND EXISTS (
                  SELECT 1 FROM "appointments" a
                  WHERE a."clientId" = u.id
                    AND (
                        COALESCE(a."notes", '') ~* '^\\s*(απ[όο]|from)\\s+fresha\\b'
                        OR COALESCE(a."notes", '') ILIKE '%fresha%'
                    )
              )
        `);

        // Ensure every Fresha customer has a customer_records entry
        await queryRunner.query(`
            INSERT INTO "customer_records" ("customerId")
            SELECT DISTINCT u.id
            FROM "users" u
            JOIN "appointments" a ON a."clientId" = u.id
            WHERE u.role = 'client'
              AND (
                  COALESCE(a."notes", '') ~* '^\\s*(απ[όο]|from)\\s+fresha\\b'
                  OR COALESCE(a."notes", '') ILIKE '%fresha%'
              )
              AND NOT EXISTS (
                  SELECT 1 FROM "customer_records" cr WHERE cr."customerId" = u.id
              )
            ON CONFLICT DO NOTHING
        `);

        // 4. Mark all existing Beauty Doctors clients as isBeautyDoctorsMember = true:
        //    - has a customer_records row (and not strictly marked clinicOwnClient without a lead)
        //    - OR matches any non-merged CRM lead by normalized mobile (last 10 digits) or real lowercase email
        //    - OR has an existing platform_broker / isBeautyDoctorsClient appointment
        await queryRunner.query(`
            UPDATE "users" u
            SET "isBeautyDoctorsMember" = true
            WHERE u.role = 'client'
              AND (
                  EXISTS (SELECT 1 FROM "customer_records" cr WHERE cr."customerId" = u.id)
                  OR EXISTS (
                      SELECT 1 FROM "leads" l
                      WHERE l.status != 'merged'
                        AND (
                            (
                                LENGTH(REGEXP_REPLACE(COALESCE(u.phone, ''), '\\D', '', 'g')) >= 10
                                AND RIGHT(REGEXP_REPLACE(COALESCE(u.phone, ''), '\\D', '', 'g'), 10)
                                  = RIGHT(REGEXP_REPLACE(COALESCE(l.phone, ''), '\\D', '', 'g'), 10)
                            )
                            OR (
                                COALESCE(u.email, '') != ''
                                AND LOWER(u.email) NOT LIKE '%noemail%'
                                AND LOWER(u.email) NOT LIKE '%@example.com'
                                AND LOWER(u.email) = LOWER(COALESCE(l.email, ''))
                            )
                        )
                  )
                  OR EXISTS (
                      SELECT 1 FROM "appointments" a
                      WHERE a."clientId" = u.id
                        AND (a."isBeautyDoctorsClient" = true OR a."appointmentSource" = 'platform_broker')
                  )
              )
        `);

        // 5. Heal existing appointments whose client IS a Beauty Doctors Member
        //    (e.g. booked by clinic secretariat for Tsironi / Stella Roditi)
        await queryRunner.query(`
            UPDATE "appointments" a
            SET "isBeautyDoctorsClient" = true
            FROM "users" u
            WHERE a."clientId" = u.id
              AND u."isBeautyDoctorsMember" = true
              AND a."isBeautyDoctorsClient" = false
        `);

        // 6. Populate missing clientDetails JSONB on appointments from the linked user
        await queryRunner.query(`
            UPDATE "appointments" a
            SET "clientDetails" = jsonb_build_object(
                'fullName', TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')),
                'phone', COALESCE(u."phone", ''),
                'email', CASE
                    WHEN COALESCE(u."email", '') = ''
                      OR LOWER(u."email") LIKE '%noemail%'
                      OR LOWER(u."email") LIKE '%@example.com'
                      OR LOWER(u."email") LIKE '%@placeholder.%'
                    THEN ''
                    ELSE u."email"
                END
            )
            FROM "users" u
            WHERE a."clientId" = u.id
              AND (
                  a."clientDetails" IS NULL
                  OR COALESCE(a."clientDetails"->>'fullName', '') = ''
                  OR COALESCE(a."clientDetails"->>'phone', '') = ''
              )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "invitationSentAt"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "isBeautyDoctorsMember"`,
        );
    }
}
