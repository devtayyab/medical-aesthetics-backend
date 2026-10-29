import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 1. Appointment status has ONE format: the upper-case enum value. "Complete Appointment"
 *    used to save 'completed' (lowercase), so those visits were missing from stats, the
 *    calendar and "My Reviews". Upper-case every known status value (trimmed).
 * 2. Adds "isLateCancellation" (cancelled less than 24h before the start).
 */
export class NormalizeAppointmentStatusAndLateCancellation1787500100000 implements MigrationInterface {
    name = 'NormalizeAppointmentStatusAndLateCancellation1787500100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Databases built from the migrations have "status" as the Postgres enum
        // appointments_status_enum (InitialSchema); the entity now maps it as varchar.
        // TRIM/UPPER and text comparisons need an explicit cast on the enum, and the
        // result must be cast back, otherwise this migration fails and blocks the deploy.
        const [col] = await queryRunner.query(`
            SELECT data_type, udt_name FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = 'appointments' AND column_name = 'status'
        `);
        const isEnum = col?.data_type === 'USER-DEFINED';
        const toColumn = (expr: string) => (isEnum ? `(${expr})::"${col.udt_name}"` : expr);

        await queryRunner.query(`
            UPDATE "appointments"
            SET "status" = ${toColumn(`UPPER(TRIM("status"::text))`)}
            WHERE "status" IS NOT NULL
              AND "status"::text <> UPPER(TRIM("status"::text))
              AND UPPER(TRIM("status"::text)) IN (
                'PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED',
                'CANCELLED', 'ARRIVED', 'NO_SHOW', 'DELETED', 'EXECUTED'
              )
        `);
        // Common spelling variants seen in old data (cannot exist in an enum column).
        if (!isEnum) {
            await queryRunner.query(`UPDATE "appointments" SET "status" = 'CANCELLED' WHERE UPPER(TRIM("status")) = 'CANCELED'`);
            await queryRunner.query(`UPDATE "appointments" SET "status" = 'NO_SHOW' WHERE UPPER(REPLACE(TRIM("status"), '-', '_')) IN ('NO_SHOW', 'NOSHOW') AND "status" <> 'NO_SHOW'`);
        }

        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "isLateCancellation" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Status normalization is not reversible (the lowercase values were a bug).
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "isLateCancellation"`);
    }
}
