import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClinicBankIbanColumns1782196509793 implements MigrationInterface {
    name = 'AddClinicBankIbanColumns1782196509793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "bankIban" character varying`);
        await queryRunner.query(`ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "bankAccountHolder" character varying`);
        await queryRunner.query(`ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "bankName" character varying`);
        await queryRunner.query(`ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "bankBic" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN IF EXISTS "bankBic"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN IF EXISTS "bankName"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN IF EXISTS "bankAccountHolder"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN IF EXISTS "bankIban"`);
    }
}
