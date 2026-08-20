import { MigrationInterface, QueryRunner } from "typeorm";

export class RevertHubSpotStatusesData1787136283923 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "leads" SET "status" = 'new' WHERE "status" = 'NEW'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'contacted' WHERE "status" = 'OPEN'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'follow_up' WHERE "status" = 'ATTEMPTED_TO_CONTACT'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'converted' WHERE "status" = 'OPEN_DEAL'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'lost' WHERE "status" = 'UNQUALIFIED'`);

        await queryRunner.query(`UPDATE "lead_clinic_statuses" SET "status" = 'new' WHERE "status" = 'NEW'`);
        await queryRunner.query(`UPDATE "lead_clinic_statuses" SET "status" = 'contacted' WHERE "status" = 'OPEN'`);
        await queryRunner.query(`UPDATE "lead_clinic_statuses" SET "status" = 'follow_up' WHERE "status" = 'ATTEMPTED_TO_CONTACT'`);
        await queryRunner.query(`UPDATE "lead_clinic_statuses" SET "status" = 'converted' WHERE "status" = 'OPEN_DEAL'`);
        await queryRunner.query(`UPDATE "lead_clinic_statuses" SET "status" = 'lost' WHERE "status" = 'UNQUALIFIED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
