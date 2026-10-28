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
        await queryRunner.query(`
            UPDATE "appointments"
            SET "status" = UPPER(TRIM("status"))
            WHERE "status" IS NOT NULL
              AND "status" <> UPPER(TRIM("status"))
              AND UPPER(TRIM("status")) IN (
                'PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED',
                'CANCELLED', 'ARRIVED', 'NO_SHOW', 'DELETED', 'EXECUTED'
              )
        `);
        // Common spelling variants seen in old data.
        await queryRunner.query(`UPDATE "appointments" SET "status" = 'CANCELLED' WHERE UPPER(TRIM("status")) = 'CANCELED'`);
        await queryRunner.query(`UPDATE "appointments" SET "status" = 'NO_SHOW' WHERE UPPER(REPLACE(TRIM("status"), '-', '_')) IN ('NO_SHOW', 'NOSHOW') AND "status" <> 'NO_SHOW'`);

        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "isLateCancellation" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Status normalization is not reversible (the lowercase values were a bug).
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "isLateCancellation"`);
    }
}
