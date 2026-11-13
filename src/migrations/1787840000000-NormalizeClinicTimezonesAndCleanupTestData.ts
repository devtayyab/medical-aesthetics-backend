import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Normalizes all clinic timezones to 'Europe/Athens' (fixing the +3h calendar offset)
 * and safely removes QA test data (fever treatment, TEST Claude payments, test tags/loyalty points).
 */
export class NormalizeClinicTimezonesAndCleanupTestData1787840000000 implements MigrationInterface {
    name = 'NormalizeClinicTimezonesAndCleanupTestData1787840000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Normalize all clinic timezones to Europe/Athens
        await queryRunner.query(`
            UPDATE "clinics"
            SET "timezone" = 'Europe/Athens'
            WHERE "timezone" IS NULL OR "timezone" != 'Europe/Athens' OR "timezone" = ''
        `);

        // 2. Remove 'fever' dummy test treatment, linked services, and any dummy appointments
        await queryRunner.query(`
            DO $$
            DECLARE
                fever_service_ids text[];
                fever_apt_ids text[];
            BEGIN
                SELECT array_agg(id::text) INTO fever_service_ids
                FROM "services"
                WHERE "treatmentId" IN (SELECT id FROM "treatments" WHERE LOWER("name") LIKE '%fever%');

                IF fever_service_ids IS NOT NULL AND array_length(fever_service_ids, 1) > 0 THEN
                    SELECT array_agg(id::text) INTO fever_apt_ids
                    FROM "appointments"
                    WHERE "serviceId"::text = ANY(fever_service_ids);

                    IF fever_apt_ids IS NOT NULL AND array_length(fever_apt_ids, 1) > 0 THEN
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_records') THEN
                            DELETE FROM "payment_records" WHERE "appointmentId"::text = ANY(fever_apt_ids);
                        END IF;
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
                            DELETE FROM "reviews" WHERE "appointmentId"::text = ANY(fever_apt_ids);
                        END IF;
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_ledger') THEN
                            DELETE FROM "loyalty_ledger" WHERE "appointmentId"::text = ANY(fever_apt_ids);
                        END IF;
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
                            DELETE FROM "notifications" WHERE "referenceId"::text = ANY(fever_apt_ids);
                        END IF;
                        DELETE FROM "appointments" WHERE id::text = ANY(fever_apt_ids);
                    END IF;

                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointment_holds') THEN
                        DELETE FROM "appointment_holds" WHERE "serviceId"::text = ANY(fever_service_ids);
                    END IF;

                    DELETE FROM "services" WHERE id::text = ANY(fever_service_ids);
                END IF;

                DELETE FROM "treatments" WHERE LOWER("name") LIKE '%fever%';
            END $$;
        `);

        // 3. Remove 'TEST Claude' dummy test payments
        await queryRunner.query(`
            DELETE FROM "payment_records"
            WHERE LOWER("notes") LIKE '%claude%' OR LOWER("notes") LIKE '%test%'
        `);

        // 4. Clean test loyalty points if table exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_points') THEN
                    DELETE FROM "loyalty_points" WHERE LOWER("description") LIKE '%test%';
                END IF;
            END $$;
        `);

        // 5. Clean test tags if table exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tags') THEN
                    DELETE FROM "customer_tags" WHERE "tagId" IN (SELECT id FROM "tags" WHERE LOWER("name") LIKE '%test%');
                    DELETE FROM "tags" WHERE LOWER("name") LIKE '%test%';
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No-op for cleanup
    }
}
