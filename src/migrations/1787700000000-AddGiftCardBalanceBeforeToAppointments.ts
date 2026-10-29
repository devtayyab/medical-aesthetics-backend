import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGiftCardBalanceBeforeToAppointments1787700000000 implements MigrationInterface {
    name = 'AddGiftCardBalanceBeforeToAppointments1787700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "giftCardBalanceBefore" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "giftCardBalanceBefore"`);
    }
}
