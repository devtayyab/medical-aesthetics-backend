import { MigrationInterface, QueryRunner } from "typeorm";
export class AddAdditionalServiceIdsToAppointments1774509000000 implements MigrationInterface {
    name = 'AddAdditionalServiceIdsToAppointments1774509000000'
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD "additionalServiceIds" json`);
        await queryRunner.query(`COMMENT ON COLUMN "appointments"."additionalServiceIds" IS 'List of extra services included in this appointment'`);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "additionalServiceIds"`);
    }
}