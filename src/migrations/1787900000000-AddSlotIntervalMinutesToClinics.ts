import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds configurable per-clinic booking slot interval (`slotIntervalMinutes`, default 30)
 * so clinics can offer 15-minute (or other custom) appointment slot intervals.
 */
export class AddSlotIntervalMinutesToClinics1787900000000 implements MigrationInterface {
    name = 'AddSlotIntervalMinutesToClinics1787900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "slotIntervalMinutes" integer NOT NULL DEFAULT 30`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "clinics" DROP COLUMN IF EXISTS "slotIntervalMinutes"`,
        );
    }
}
