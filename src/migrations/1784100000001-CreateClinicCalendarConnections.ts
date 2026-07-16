import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicCalendarConnections1784100000001
  implements MigrationInterface
{
  name = 'CreateClinicCalendarConnections1784100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinic_calendar_connections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clinicId" uuid NOT NULL,
        "provider" character varying(20) NOT NULL DEFAULT 'google',
        "googleAccountEmail" character varying,
        "calendarId" character varying,
        "calendarSummary" character varying,
        "refreshTokenEnc" text,
        "accessTokenEnc" text,
        "tokenExpiry" TIMESTAMP WITH TIME ZONE,
        "syncToken" text,
        "watchChannelId" character varying,
        "watchResourceId" character varying,
        "watchToken" character varying,
        "watchExpiration" TIMESTAMP WITH TIME ZONE,
        "status" character varying(20) NOT NULL DEFAULT 'connected',
        "syncEnabled" boolean NOT NULL DEFAULT true,
        "lastError" text,
        "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinic_calendar_connections" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_clinic_calendar_connections_clinicId" ON "clinic_calendar_connections" ("clinicId")`,
    );

    // Fast lookup of the connection to sync when a Google push notification arrives.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_clinic_calendar_connections_watchChannelId" ON "clinic_calendar_connections" ("watchChannelId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_clinic_calendar_connections_watchChannelId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_clinic_calendar_connections_clinicId"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "clinic_calendar_connections"`,
    );
  }
}
