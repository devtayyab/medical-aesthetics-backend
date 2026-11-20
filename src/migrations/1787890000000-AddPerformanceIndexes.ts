import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds missing indexes on high-traffic tables (`leads`, `users`, `appointments`,
 * `blocked_time_slots`, `services`, `crm_actions`, `platform_settings`) to eliminate
 * full-table sequential scans and prevent 504 gateway timeouts under concurrent load.
 */
export class AddPerformanceIndexes1787890000000 implements MigrationInterface {
    name = 'AddPerformanceIndexes1787890000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // leads (30k+ rows — previously 0 indexes on contact/FB/conversion columns)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_lower_email" ON "leads" (LOWER("email")) WHERE "email" IS NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_phone_key" ON "leads" (RIGHT(regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g'), 10))`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_facebookLeadId" ON "leads" ("facebookLeadId") WHERE "facebookLeadId" IS NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_facebookFormId" ON "leads" ("facebookFormId") WHERE "facebookFormId" IS NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_converted_user" ON "leads" (("metadata"->>'convertedToUserId')) WHERE "metadata" IS NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_converted_customer" ON "leads" (("metadata"->>'convertedToCustomerId')) WHERE "metadata" IS NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_leads_existing_customer" ON "leads" (("metadata"->>'existingCustomerId')) WHERE "metadata" IS NOT NULL`,
        );

        // users
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_users_lower_email" ON "users" (LOWER("email"))`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_users_phone_key" ON "users" (RIGHT(regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g'), 10))`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_users_role_active" ON "users" ("role", "isActive")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_users_assignedClinicId" ON "users" ("assignedClinicId") WHERE "assignedClinicId" IS NOT NULL`,
        );

        // appointments (previously only PK index)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_appointments_clinic_time" ON "appointments" ("clinicId", "startTime", "endTime")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_appointments_clientId" ON "appointments" ("clientId")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_appointments_status_startTime" ON "appointments" ("status", "startTime")`,
        );

        // blocked_time_slots
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_blocked_slots_clinic_time" ON "blocked_time_slots" ("clinicId", "startTime", "endTime")`,
        );

        // services
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_services_clinic_active" ON "services" ("clinicId", "isActive")`,
        );

        // crm_actions
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_crm_actions_relatedAppointmentId" ON "crm_actions" ("relatedAppointmentId") WHERE "relatedAppointmentId" IS NOT NULL`,
        );

        // platform_settings
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_platform_settings_key" ON "platform_settings" ("key")`,
        );

        // Refresh planner statistics so PostgreSQL immediately chooses the new indexes
        await queryRunner.query(
            `ANALYZE "leads", "users", "appointments", "blocked_time_slots", "services", "crm_actions", "platform_settings"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_platform_settings_key"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_relatedAppointmentId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_clinic_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_blocked_slots_clinic_time"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_status_startTime"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_clientId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_clinic_time"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_assignedClinicId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_phone_key"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_lower_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_existing_customer"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_converted_customer"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_converted_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_facebookFormId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_facebookLeadId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_phone_key"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_lower_email"`);
    }
}
