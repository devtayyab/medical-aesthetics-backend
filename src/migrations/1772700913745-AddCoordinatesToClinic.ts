import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoordinatesToClinic1772700913745 implements MigrationInterface {
    name = 'AddCoordinatesToClinic1772700913745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinics" ADD "latitude" numeric(10,8)`);
        await queryRunner.query(`ALTER TABLE "clinics" ADD "longitude" numeric(11,8)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN "latitude"`);
    }

}
