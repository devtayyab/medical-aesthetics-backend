import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleCalendarFieldsToAppointments1784100000002
  implements MigrationInterface
{
  name = 'AddGoogleCalendarFieldsToAppointments1784100000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The Google Calendar event id this appointment is mirrored to (per clinic calendar).
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "googleCalendarEventId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "googleCalendarSyncedAt" TIMESTAMP WITH TIME ZONE`,
    );
    // synced | pending | failed | null(=never attempted / not applicable)
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "googleCalendarSyncStatus" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "googleCalendarSyncStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "googleCalendarSyncedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "googleCalendarEventId"`,
    );
  }
}
