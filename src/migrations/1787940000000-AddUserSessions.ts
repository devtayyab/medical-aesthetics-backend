import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One row per logged-in device. Replaces the single users."refreshToken" check, which let
 * only one device stay logged in: a login on a second device (e.g. phone + desktop)
 * logged the first one out at its next token refresh, 15 minutes later at most.
 */
export class AddUserSessions1787940000000 implements MigrationInterface {
  name = 'AddUserSessions1787940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "tokenHash" varchar(64) NOT NULL,
        "userId" uuid NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("tokenHash")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_sessions_userId" ON "user_sessions" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions"`);
  }
}
