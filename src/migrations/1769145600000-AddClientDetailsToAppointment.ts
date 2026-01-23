import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientDetailsToAppointment1769145600000 implements MigrationInterface {
    name = 'AddClientDetailsToAppointment1769145600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD "clientDetails" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "clientDetails"`);
    }
}
