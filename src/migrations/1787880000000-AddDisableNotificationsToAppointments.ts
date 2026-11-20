import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds per-appointment notification suppression (`disableNotifications`) and
 * backfills all Fresha-imported appointments ("Από Fresha ...") so they never
 * trigger automatic emails, push notifications, or reminders.
 */
export class AddDisableNotificationsToAppointments1787880000000 implements MigrationInterface {
    name = 'AddDisableNotificationsToAppointments1787880000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "disableNotifications" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `UPDATE "appointments" SET "disableNotifications" = true WHERE COALESCE("notes", '') ~* '^\\s*(απ[όο]|from)\\s+fresha'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "disableNotifications"`,
        );
    }
}
