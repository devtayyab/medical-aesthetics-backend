import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourceFieldsToBlockedTimeSlots1784100000003
  implements MigrationInterface
{
  name = 'AddSourceFieldsToBlockedTimeSlots1784100000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 'manual' (default) for staff-created blocks; 'google_calendar' for slots
    // materialized from externally-created Google events.
    await queryRunner.query(
      `ALTER TABLE "blocked_time_slots" ADD COLUMN IF NOT EXISTS "source" character varying(30) NOT NULL DEFAULT 'manual'`,
    );
    // The originating Google Calendar event id (for google_calendar source).
    await queryRunner.query(
      `ALTER TABLE "blocked_time_slots" ADD COLUMN IF NOT EXISTS "externalEventId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "blocked_time_slots" ADD COLUMN IF NOT EXISTS "externalSyncedAt" TIMESTAMP WITH TIME ZONE`,
    );
    // Idempotent upsert target: one blocked slot per (clinic, external event).
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_blocked_time_slots_clinic_externalEvent" ON "blocked_time_slots" ("clinicId", "externalEventId") WHERE "externalEventId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_blocked_time_slots_clinic_externalEvent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blocked_time_slots" DROP COLUMN IF EXISTS "externalSyncedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blocked_time_slots" DROP COLUMN IF EXISTS "externalEventId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blocked_time_slots" DROP COLUMN IF EXISTS "source"`,
    );
  }
}
