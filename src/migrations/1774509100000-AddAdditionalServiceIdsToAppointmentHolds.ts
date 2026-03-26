import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdditionalServiceIdsToAppointmentHolds1774509100000 implements MigrationInterface {
    name = 'AddAdditionalServiceIdsToAppointmentHolds1774509100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment_holds" ADD "additionalServiceIds" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment_holds" DROP COLUMN "additionalServiceIds"`);
    }

}
