import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCustomerIdNullableInCrmAction1770979111213 implements MigrationInterface {
    name = 'MakeCustomerIdNullableInCrmAction1770979111213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" DROP CONSTRAINT "FK_ad_spend_logs_campaignId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad_spend_logs_campaignId"`);
        await queryRunner.query(`ALTER TYPE "public"."communication_logs_type_enum" RENAME TO "communication_logs_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_type_enum" AS ENUM('call', 'email', 'sms', 'whatsapp', 'meeting', 'note')`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "type" TYPE "public"."communication_logs_type_enum" USING "type"::"text"::"public"."communication_logs_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."communication_logs_direction_enum" RENAME TO "communication_logs_direction_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_direction_enum" AS ENUM('outgoing', 'incoming', 'missed')`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "direction" TYPE "public"."communication_logs_direction_enum" USING "direction"::"text"::"public"."communication_logs_direction_enum"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_direction_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."communication_logs_status_enum" RENAME TO "communication_logs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_status_enum" AS ENUM('completed', 'missed', 'no_answer', 'voicemail', 'scheduled', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" TYPE "public"."communication_logs_status_enum" USING "status"::"text"::"public"."communication_logs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" SET DEFAULT 'completed'`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "amount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "clicks" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "impressions" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "leads" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "createdAt" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_10bec20149e7f8910d4d9acac2" ON "ad_spend_logs" ("campaignId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_10bec20149e7f8910d4d9acac2"`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "createdAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "leads" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "impressions" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "clicks" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "amount" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_status_enum_old" AS ENUM('completed', 'missed', 'no_answer', 'voicemail', 'scheduled', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" TYPE "public"."communication_logs_status_enum_old" USING "status"::"text"::"public"."communication_logs_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" SET DEFAULT 'completed'`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."communication_logs_status_enum_old" RENAME TO "communication_logs_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_direction_enum_old" AS ENUM('outgoing', 'incoming', 'missed')`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "direction" TYPE "public"."communication_logs_direction_enum_old" USING "direction"::"text"::"public"."communication_logs_direction_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_direction_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."communication_logs_direction_enum_old" RENAME TO "communication_logs_direction_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_type_enum_old" AS ENUM('call', 'email', 'sms', 'whatsapp', 'meeting', 'note')`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "type" TYPE "public"."communication_logs_type_enum_old" USING "type"::"text"::"public"."communication_logs_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."communication_logs_type_enum_old" RENAME TO "communication_logs_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_ad_spend_logs_campaignId" ON "ad_spend_logs" ("campaignId") `);
        await queryRunner.query(`ALTER TABLE "ad_spend_logs" ADD CONSTRAINT "FK_ad_spend_logs_campaignId" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
