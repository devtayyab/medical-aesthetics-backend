import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds email bounce tracking columns to `users` and creates the global `email_bounces`
 * suppression table so bounced / complained addresses are recorded on customer profiles
 * and permanently blocked from receiving further emails.
 */
export class AddEmailBounceTracking1787920000000 implements MigrationInterface {
  name = 'AddEmailBounceTracking1787920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailBounced" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailBouncedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailBounceReason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailBounceType" varchar(64)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_email_bounced" ON "users" ("emailBounced") WHERE "emailBounced" = true`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_bounces" (
        "email" varchar(320) NOT NULL,
        "bounceType" varchar(64) NOT NULL DEFAULT 'Permanent',
        "bounceSubType" varchar(120),
        "reason" text,
        "source" varchar(64) NOT NULL DEFAULT 'ses_sns',
        "diagnosticCode" text,
        "bouncedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_bounces_email" PRIMARY KEY ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_bounces"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_bounced"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailBounceType"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailBounceReason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailBouncedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailBounced"`);
  }
}
