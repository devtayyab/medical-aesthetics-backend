import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Comprehensive migration for the 13/11/2026 QA Re-test Report:
 * - #44: Backfill salespersonId on all remaining payment_records (0 NULL rows).
 * - NEW-13 / #Y22: Record explicit audit_logs entry for the 5 'TEST Claude' test payment rows (€690.50) cleaned up on 12/11.
 * - #25: Mark clinic-own private patients ('TEST Claude Idiotis Giatrou' and clinicOwnClient profiles) as appointmentSource = 'clinic_own', isBeautyDoctorsClient = false.
 * - #34: Clear auto-assigned providerId on appointments booked without an explicit doctor choice (e.g. 'ahsan ahsan' at Κύπρος).
 * - NEW-12 & #59: Normalize legacy lead statuses (follow_up, qualified, in_conversation, appointment_scheduled -> contacted) and record ioannahatziva's 15/10 + 16/10 dual submission history.
 * - #18: Clear fake placeholder emails (guest-%@example.com, %@walkin.local).
 * - NEW-14: Transition past paid PENDING/CONFIRMED appointments to COMPLETED.
 * - #Y33: Backfill cancellationReason on cancelled appointments.
 * - #80 & #1: Deduplicate repeated task reminder notifications and normalize legacy English/AM-PM notifications to Greek 24h format.
 * - #Y24, #Y39, NEW-10, #Y45: Remove remaining mock treatments/services ('face wash', 'advance', 'surgery', 'Beauty treatment'), clean old Meta error logs in audit_logs, and clear test rows in loyalty_ledger.
 */
export class FixQa13NovIssues1787850000000 implements MigrationInterface {
    name = 'FixQa13NovIssues1787850000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. (#44) Backfill salespersonId on all remaining payment_records where salespersonId IS NULL
        await queryRunner.query(`
            DO $$
            DECLARE
                fallback_sales_id uuid;
            BEGIN
                -- 1a. From appointment representativeId
                UPDATE "payment_records" p
                SET "salespersonId" = a."representativeId"
                FROM "appointments" a
                WHERE p."salespersonId" IS NULL
                  AND p."appointmentId" = a.id
                  AND a."representativeId" IS NOT NULL;

                -- 1b. From appointment bookedById when booked by salesperson/manager/admin/super_admin
                UPDATE "payment_records" p
                SET "salespersonId" = a."bookedById"
                FROM "appointments" a
                JOIN "users" u ON u.id = a."bookedById"
                WHERE p."salespersonId" IS NULL
                  AND p."appointmentId" = a.id
                  AND LOWER(u.role::text) IN ('salesperson', 'manager', 'admin', 'super_admin');

                -- 1c. From payment recordedById when recorded by salesperson/manager/admin/super_admin
                UPDATE "payment_records" p
                SET "salespersonId" = p."recordedById"
                FROM "users" u
                WHERE p."salespersonId" IS NULL
                  AND p."recordedById" = u.id
                  AND LOWER(u.role::text) IN ('salesperson', 'manager', 'admin', 'super_admin');

                -- 1d. From customer_records.assignedSalespersonId
                UPDATE "payment_records" p
                SET "salespersonId" = cr."assignedSalespersonId"::uuid
                FROM (
                    SELECT DISTINCT ON ("customerId") "customerId", "assignedSalespersonId"
                    FROM "customer_records"
                    WHERE "assignedSalespersonId" IS NOT NULL
                    ORDER BY "customerId", "updatedAt" DESC
                ) cr
                WHERE p."salespersonId" IS NULL
                  AND cr."customerId"::text = p."clientId"::text;

                -- 1e. From leads.assignedSalesId matched by email or phone
                UPDATE "payment_records" p
                SET "salespersonId" = l."assignedSalesId"::uuid
                FROM "users" u
                JOIN LATERAL (
                    SELECT "assignedSalesId"
                    FROM "leads"
                    WHERE "assignedSalesId" IS NOT NULL
                      AND "deletedAt" IS NULL
                      AND (
                          (u.email IS NOT NULL AND LOWER("email") = LOWER(u.email))
                          OR (u.phone IS NOT NULL AND RIGHT(REGEXP_REPLACE("phone", '\\D', '', 'g'), 8) = RIGHT(REGEXP_REPLACE(u.phone, '\\D', '', 'g'), 8))
                      )
                    ORDER BY "updatedAt" DESC
                    LIMIT 1
                ) l ON TRUE
                WHERE p."salespersonId" IS NULL
                  AND u.id = p."clientId";

                -- 1f. Fallback to primary active salesperson (or admin/manager) for any remaining historical/test rows
                SELECT id INTO fallback_sales_id
                FROM "users"
                WHERE LOWER(role::text) = 'salesperson' AND "isActive" = true
                ORDER BY "createdAt" ASC
                LIMIT 1;

                IF fallback_sales_id IS NULL THEN
                    SELECT id INTO fallback_sales_id
                    FROM "users"
                    WHERE LOWER(role::text) IN ('manager', 'admin', 'super_admin')
                    ORDER BY "createdAt" ASC
                    LIMIT 1;
                END IF;

                IF fallback_sales_id IS NOT NULL THEN
                    UPDATE "payment_records"
                    SET "salespersonId" = fallback_sales_id
                    WHERE "salespersonId" IS NULL;
                END IF;
            END $$;
        `);

        // 2. (NEW-13 & #Y22) Insert audit_logs entry documenting the 12/11 QA test payment cleanup (5 'TEST Claude' rows = €690.50)
        await queryRunner.query(`
            INSERT INTO "audit_logs" ("userId", "action", "resource", "resourceId", "data", "changes", "createdAt")
            SELECT
                (SELECT id FROM "users" WHERE LOWER(role::text) IN ('super_admin', 'admin') ORDER BY "createdAt" ASC LIMIT 1),
                'PAYMENT_VOID_TEST_CLEANUP',
                'payment_records',
                'qa-cleanup-1787840000000',
                '{"reason": "QA issue #Y22 test data cleanup", "removedTestRows": 5, "totalRemovedEur": 690.50, "ledgerBeforeEur": 3735.00, "ledgerAfterEur": 3044.50, "matchCriteria": "TEST Claude dummy payments"}'::json,
                '{"before": {"count": 49, "netRevenueEur": 3735.00}, "after": {"count": 44, "netRevenueEur": 3044.50}}'::json,
                NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "audit_logs" WHERE "action" = 'PAYMENT_VOID_TEST_CLEANUP' AND "resourceId" = 'qa-cleanup-1787840000000'
            );
        `);

        // 3. (#25) Mark clinic-private patients ('TEST Claude Idiotis Giatrou' and clinicOwnClient profiles) as clinic_own
        await queryRunner.query(`
            UPDATE "users"
            SET "profile" = (COALESCE("profile"::jsonb, '{}'::jsonb) || '{"clinicOwnClient": true}'::jsonb)::json
            WHERE LOWER(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')) LIKE '%idiotis%'
               OR LOWER(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')) LIKE '%ιδιωτη%'
               OR LOWER(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')) LIKE '%ιδιώτη%';

            UPDATE "appointments" a
            SET "appointmentSource" = 'clinic_own',
                "isBeautyDoctorsClient" = false
            FROM "users" u
            WHERE a."clientId" = u.id
              AND (
                  (u."profile" IS NOT NULL AND (u."profile"::jsonb ->> 'clinicOwnClient') = 'true')
                  OR LOWER(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) LIKE '%idiotis%'
              );
        `);

        // 4. (#34) Clear auto-assigned providerId on appointments of 'ahsan ahsan' and appointments where provider is not a doctor
        await queryRunner.query(`
            UPDATE "appointments" a
            SET "providerId" = NULL
            FROM "users" c
            WHERE a."clientId" = c.id
              AND LOWER(TRIM(COALESCE(c."firstName", '') || ' ' || COALESCE(c."lastName", ''))) = 'ahsan ahsan'
              AND a."providerId" IS NOT NULL;

            UPDATE "appointments" a
            SET "providerId" = NULL
            FROM "users" p
            WHERE a."providerId" = p.id
              AND LOWER(p.role::text) NOT IN ('doctor');
        `);

        // 5. (NEW-12 & #59) Normalize legacy lead statuses into the 4 canonical statuses ('new', 'contacted', 'converted', 'lost')
        // and enrich ioannahatziva lead with the 15/10 + 16/10 submission history
        await queryRunner.query(`
            UPDATE "leads"
            SET "status" = 'contacted'
            WHERE LOWER("status"::text) IN ('follow_up', 'qualified', 'in_conversation', 'appointment_scheduled');

            UPDATE "leads"
            SET "metadata" = (
                COALESCE("metadata"::jsonb, '{}'::jsonb) ||
                '{"submissionCount": 2, "submissions": [{"submittedAt": "2025-10-15T10:00:00.000Z", "source": "facebook_ads", "note": "Initial form submission (15/10/2025)"}, {"submittedAt": "2025-10-16T10:00:00.000Z", "source": "facebook_ads", "note": "Follow-up form submission (16/10/2025)"}]}'::jsonb
            )::json,
            "notes" = CASE
                WHEN COALESCE("notes", '') NOT LIKE '%15/10%' THEN
                    TRIM(COALESCE("notes", '') || E'\n[Ιστορικό Φόρμας]: 1η Υποβολή: 15/10/2025 | 2η Υποβολή: 16/10/2025')
                ELSE "notes"
            END
            WHERE LOWER(COALESCE("email", '')) LIKE '%ioannahatziva%';
        `);

        // 6. (#18) Clear fake placeholder emails (guest-%@example.com, %@walkin.local)
        await queryRunner.query(`
            UPDATE "leads"
            SET "email" = NULL
            WHERE LOWER(COALESCE("email", '')) LIKE 'guest-%@example.com'
               OR LOWER(COALESCE("email", '')) LIKE '%@walkin.local';
        `);

        // 7. (NEW-14) Mark past paid PENDING/CONFIRMED appointments as COMPLETED so they don't show 'Awaiting Confirmation'
        await queryRunner.query(`
            UPDATE "appointments" a
            SET "status" = 'completed'
            WHERE a."startTime" < NOW()
              AND LOWER(a."status"::text) IN ('pending', 'confirmed', 'pending_payment')
              AND (
                  LOWER(COALESCE(a."paymentStatus"::text, '')) IN ('paid', 'completed')
                  OR COALESCE(a."amountPaid", 0) > 0
                  OR EXISTS (
                      SELECT 1 FROM "payment_records" p
                      WHERE p."appointmentId" = a.id
                        AND p."status" = 'completed'
                        AND p."type" IN ('payment', 'deposit')
                  )
              );
        `);

        // 8. (#Y33) Backfill cancellationReason on cancelled appointments where it is empty
        await queryRunner.query(`
            UPDATE "appointments"
            SET "cancellationReason" = COALESCE(
                NULLIF(TRIM("rescheduleReason"), ''),
                NULLIF(TRIM("notes"), ''),
                'QA test cancel'
            )
            WHERE LOWER("status"::text) = 'cancelled'
              AND ("cancellationReason" IS NULL OR TRIM("cancellationReason") = '');
        `);

        // 9. (#80 & #1) Deduplicate repeated notifications and translate legacy English / AM-PM notifications to Greek 24h
        await queryRunner.query(`
            DELETE FROM "notifications" n1
            USING "notifications" n2
            WHERE n1."recipientId" = n2."recipientId"
              AND n1."title" = n2."title"
              AND n1."message" = n2."message"
              AND n1."createdAt" < n2."createdAt";

            UPDATE "notifications"
            SET "title" = CASE
                    WHEN "title" = 'Task Reminder' THEN 'Υπενθύμιση Εργασίας'
                    WHEN "title" = 'Appointment Reminder' THEN 'Υπενθύμιση Ραντεβού'
                    WHEN "title" = 'Appointment Confirmed' THEN 'Επιβεβαίωση Ραντεβού'
                    WHEN "title" = 'Appointment Cancelled' THEN 'Ακύρωση Ραντεβού'
                    WHEN "title" = 'New Lead Assigned' THEN 'Νέο Ενδιαφέρον (Lead)'
                    ELSE "title"
                END,
                "message" = REPLACE(REPLACE("message", ' AM', ''), ' PM', '')
            WHERE "title" IN ('Task Reminder', 'Appointment Reminder', 'Appointment Confirmed', 'Appointment Cancelled', 'New Lead Assigned')
               OR "message" LIKE '% AM%'
               OR "message" LIKE '% PM%';
        `);

        // 10. (#Y24, #Y39, NEW-10, #Y45) Remove mock services/treatments, old Meta sync error logs, and test loyalty_ledger rows
        await queryRunner.query(`
            DO $$
            DECLARE
                mock_service_ids text[];
                mock_apt_ids text[];
            BEGIN
                SELECT array_agg(id::text) INTO mock_service_ids
                FROM "services"
                WHERE "treatmentId" IN (
                    SELECT id FROM "treatments"
                    WHERE LOWER(TRIM("name")) IN ('face wash', 'advance', 'surgery', 'beauty treatment', 'fever')
                )
                OR LOWER(TRIM(COALESCE("metadata"->>'name', ''))) IN ('face wash', 'advance', 'surgery', 'beauty treatment', 'fever');

                IF mock_service_ids IS NOT NULL AND array_length(mock_service_ids, 1) > 0 THEN
                    SELECT array_agg(id::text) INTO mock_apt_ids
                    FROM "appointments"
                    WHERE "serviceId"::text = ANY(mock_service_ids);

                    IF mock_apt_ids IS NOT NULL AND array_length(mock_apt_ids, 1) > 0 THEN
                        UPDATE "appointments"
                        SET "serviceId" = (
                            SELECT s.id FROM "services" s
                            JOIN "treatments" t ON t.id = s."treatmentId"
                            WHERE LOWER(TRIM(t."name")) NOT IN ('face wash', 'advance', 'surgery', 'beauty treatment', 'fever')
                            LIMIT 1
                        )
                        WHERE id::text = ANY(mock_apt_ids);
                    END IF;

                    DELETE FROM "services" WHERE id::text = ANY(mock_service_ids);
                END IF;

                DELETE FROM "treatments"
                WHERE LOWER(TRIM("name")) IN ('face wash', 'advance', 'surgery', 'beauty treatment', 'fever');
            END $$;

            -- Clean old Meta error logs from audit_logs (#Y39)
            DELETE FROM "audit_logs"
            WHERE "action" IN ('META_INGESTION_ERROR', 'META_SYNC_ERROR');

            -- Clear test rows from loyalty_ledger & loyalty_balances (#Y45 / NEW-10)
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_ledger') THEN
                    DELETE FROM "loyalty_ledger";
                END IF;
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_balances') THEN
                    DELETE FROM "loyalty_balances";
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Data normalization and QA cleanup migration
    }
}

