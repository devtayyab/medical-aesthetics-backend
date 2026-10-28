import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRescheduleReasonToAppointments1787400000000 implements MigrationInterface {
    name = 'AddRescheduleReasonToAppointments1787400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "rescheduleReason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "rescheduleReason"`);
    }
}
