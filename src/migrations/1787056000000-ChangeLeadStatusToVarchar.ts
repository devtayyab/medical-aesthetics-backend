import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeLeadStatusToVarchar1787056000000 implements MigrationInterface {
    name = 'ChangeLeadStatusToVarchar1787056000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the default before altering type
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT`);
        
        // Convert to varchar (if it was an enum in postgres, this casts it to varchar)
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" TYPE varchar USING status::varchar`);
        
        // Map old English statuses to HubSpot Greek statuses (or their uppercase codes)
        // Hubspot API gave us: NEW, OPEN, OPEN_DEAL, UNQUALIFIED, etc.
        await queryRunner.query(`UPDATE "leads" SET "status" = 'NEW' WHERE "status" = 'new'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'OPEN' WHERE "status" = 'contacted'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'OPEN' WHERE "status" = 'in_conversation'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'ATTEMPTED_TO_CONTACT' WHERE "status" = 'follow_up'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'OPEN_DEAL' WHERE "status" = 'converted'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'OPEN_DEAL' WHERE "status" = 'appointment_scheduled'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'UNQUALIFIED' WHERE "status" = 'lost'`);

        // Set default to NEW
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert default
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT`);
        
        // Reverse mapping
        await queryRunner.query(`UPDATE "leads" SET "status" = 'new' WHERE "status" = 'NEW'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'in_conversation' WHERE "status" = 'OPEN'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'converted' WHERE "status" = 'OPEN_DEAL'`);
        await queryRunner.query(`UPDATE "leads" SET "status" = 'lost' WHERE "status" = 'UNQUALIFIED'`);

        // Change type back to enum (requires creating type if it doesn't exist, but typically casting works if the type exists)
        // This is a simplification for the down migration
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" TYPE "public"."leads_status_enum" USING status::"public"."leads_status_enum"`);
        
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'`);
    }
}
