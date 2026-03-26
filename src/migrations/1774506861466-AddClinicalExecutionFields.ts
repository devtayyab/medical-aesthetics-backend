import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClinicalExecutionFields1774506861466 implements MigrationInterface {
    name = 'AddClinicalExecutionFields1774506861466'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create table if not exists
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "clinic_ownership" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "clinicId" uuid NOT NULL, 
            "ownerUserId" uuid NOT NULL, 
            "visibilityScope" character varying(20) NOT NULL DEFAULT 'private', 
            CONSTRAINT "PK_clinic_ownership" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_clinic_ownership_clinicId" ON "clinic_ownership" ("clinicId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_clinic_ownership_ownerUserId" ON "clinic_ownership" ("ownerUserId")`);

        // Add columns if not exist
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "executedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "executedById" uuid`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "isBeautyDoctorsClient" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "representativeId" uuid`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "rewardPointsRedeemed" numeric(10,2) NOT NULL DEFAULT '0'`);

        // Constraints
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_appointments_executedById') THEN
                    ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_executedById" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_appointments_representativeId') THEN
                    ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_representativeId" FOREIGN KEY ("representativeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "executedAt"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "executedById"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "isBeautyDoctorsClient"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "representativeId"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "rewardPointsRedeemed"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clinic_ownership"`);
    }
}
