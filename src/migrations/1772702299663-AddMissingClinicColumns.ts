import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingClinicColumns1772702299663 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add photoUrl if missing
        const hasPhotoUrl = await queryRunner.query(
            `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name='clinics' AND column_name='photoUrl'`
        );
        if (hasPhotoUrl.length === 0) {
            await queryRunner.query(`ALTER TABLE "clinics" ADD "photoUrl" character varying`);
        }

        // Add treatmentRooms if missing
        const hasTreatmentRooms = await queryRunner.query(
            `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name='clinics' AND column_name='treatmentRooms'`
        );
        if (hasTreatmentRooms.length === 0) {
            await queryRunner.query(`ALTER TABLE "clinics" ADD "treatmentRooms" integer NOT NULL DEFAULT 1`);
        }

        // Add rating if missing
        const hasRating = await queryRunner.query(
            `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name='clinics' AND column_name='rating'`
        );
        if (hasRating.length === 0) {
            await queryRunner.query(`ALTER TABLE "clinics" ADD "rating" numeric(3,2) NOT NULL DEFAULT 0`);
        }

        // Add reviewCount if missing
        const hasReviewCount = await queryRunner.query(
            `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name='clinics' AND column_name='reviewCount'`
        );
        if (hasReviewCount.length === 0) {
            await queryRunner.query(`ALTER TABLE "clinics" ADD "reviewCount" integer NOT NULL DEFAULT 0`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN "reviewCount"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN "treatmentRooms"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN "photoUrl"`);
    }

}
