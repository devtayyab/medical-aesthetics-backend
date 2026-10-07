import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingConsentAndGiftCardColumns1787200000000 implements MigrationInterface {
    name = 'AddMissingConsentAndGiftCardColumns1787200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users consent columns
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketingEmailConsent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketingEmailConsentDate" TIMESTAMP WITH TIME ZONE`);

        // Services giftCardEligible column
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "giftCardEligible" boolean NOT NULL DEFAULT false`);

        // Treatments giftCardEligible column
        await queryRunner.query(`ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "giftCardEligible" boolean NOT NULL DEFAULT false`);

        // Make salespersonId nullable in crm_actions if not already
        await queryRunner.query(`ALTER TABLE "crm_actions" ALTER COLUMN "salespersonId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "marketingEmailConsentDate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "marketingEmailConsent"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN IF EXISTS "giftCardEligible"`);
        await queryRunner.query(`ALTER TABLE "treatments" DROP COLUMN IF EXISTS "giftCardEligible"`);
    }
}
