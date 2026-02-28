import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCustomerIdNullableInCrmAction1770979111213 implements MigrationInterface {
    name = 'MakeCustomerIdNullableInCrmAction1770979111213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Handle crm_actions customerId nullability (as per migration name)
        const crmActionsTable = await queryRunner.query(
            `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_actions')`
        );
        if (crmActionsTable[0].exists) {
            await queryRunner.query(`ALTER TABLE "crm_actions" ALTER COLUMN "customerId" DROP NOT NULL`);
        }

        // 2. Handle ad_spend_logs table safely
        const adSpendLogsExists = await queryRunner.query(
            `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_spend_logs')`
        );

        if (adSpendLogsExists[0].exists) {
            // Table exists, run the migrations needed to align it
            const fkExists = await queryRunner.query(
                `SELECT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'FK_ad_spend_logs_campaignId')`
            );
            if (fkExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "ad_spend_logs" DROP CONSTRAINT "FK_ad_spend_logs_campaignId"`);
            }

            const idxExists = await queryRunner.query(
                `SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'IDX_ad_spend_logs_campaignId')`
            );
            if (idxExists[0].exists) {
                await queryRunner.query(`DROP INDEX "public"."IDX_ad_spend_logs_campaignId"`);
            }

            await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "amount" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "clicks" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "impressions" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "leads" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "ad_spend_logs" ALTER COLUMN "createdAt" SET NOT NULL`);
        } else {
            // Table doesn't exist, create it from scratch matching current entity state
            await queryRunner.query(`
                CREATE TABLE "ad_spend_logs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "campaignId" uuid NOT NULL,
                    "date" date NOT NULL,
                    "amount" numeric(12,2) NOT NULL DEFAULT '0',
                    "clicks" integer NOT NULL DEFAULT '0',
                    "impressions" integer NOT NULL DEFAULT '0',
                    "leads" integer NOT NULL DEFAULT '0',
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_ad_spend_logs_id" PRIMARY KEY ("id")
                )
            `);
        }

        // Ensure the new index exists
        const newIdxExists = await queryRunner.query(
            `SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'IDX_10bec20149e7f8910d4d9acac2')`
        );
        if (!newIdxExists[0].exists) {
            await queryRunner.query(`CREATE INDEX "IDX_10bec20149e7f8910d4d9acac2" ON "ad_spend_logs" ("campaignId") `);
        }

        // 3. Handle communication_logs enum updates safely
        const typeExists = async (typeName: string): Promise<boolean> => {
            const result = await queryRunner.query(`SELECT EXISTS (SELECT FROM pg_type WHERE typname = '${typeName}')`);
            return result[0].exists;
        };

        if (await typeExists('communication_logs_type_enum')) {
            await queryRunner.query(`ALTER TYPE "public"."communication_logs_type_enum" RENAME TO "communication_logs_type_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."communication_logs_type_enum" AS ENUM('call', 'email', 'sms', 'whatsapp', 'meeting', 'note')`);
            await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "type" TYPE "public"."communication_logs_type_enum" USING "type"::"text"::"public"."communication_logs_type_enum"`);
            await queryRunner.query(`DROP TYPE "public"."communication_logs_type_enum_old"`);
        }

        if (await typeExists('communication_logs_direction_enum')) {
            await queryRunner.query(`ALTER TYPE "public"."communication_logs_direction_enum" RENAME TO "communication_logs_direction_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."communication_logs_direction_enum" AS ENUM('outgoing', 'incoming', 'missed')`);
            await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "direction" TYPE "public"."communication_logs_direction_enum" USING "direction"::"text"::"public"."communication_logs_direction_enum"`);
            await queryRunner.query(`DROP TYPE "public"."communication_logs_direction_enum_old"`);
        }

        if (await typeExists('communication_logs_status_enum')) {
            await queryRunner.query(`ALTER TYPE "public"."communication_logs_status_enum" RENAME TO "communication_logs_status_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."communication_logs_status_enum" AS ENUM('completed', 'missed', 'no_answer', 'voicemail', 'scheduled', 'cancelled')`);
            await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" TYPE "public"."communication_logs_status_enum" USING "status"::"text"::"public"."communication_logs_status_enum"`);
            await queryRunner.query(`ALTER TABLE "communication_logs" ALTER COLUMN "status" SET DEFAULT 'completed'`);
            await queryRunner.query(`DROP TYPE "public"."communication_logs_status_enum_old"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Basic reverting logic
        await queryRunner.query(`ALTER TABLE "crm_actions" ALTER COLUMN "customerId" SET NOT NULL`);
        // We won't reconstruct the complex enum rename dance for 'down' as it's risky and usually not needed for automated rollbacks during failures
    }
}
