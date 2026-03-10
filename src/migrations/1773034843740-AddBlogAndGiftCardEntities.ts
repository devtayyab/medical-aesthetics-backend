import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlogAndGiftCardEntities1773034843740 implements MigrationInterface {
    name = 'AddBlogAndGiftCardEntities1773034843740'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
    }

}
