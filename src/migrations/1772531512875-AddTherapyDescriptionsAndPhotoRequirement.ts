import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTherapyDescriptionsAndPhotoRequirement1772531512875 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename description to fullDescription
        await queryRunner.query(`ALTER TABLE "services" RENAME COLUMN "description" TO "fullDescription"`);

        // Add shortDescription column
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "shortDescription" text`);

        // Populate shortDescription from fullDescription (first 150 chars or so)
        await queryRunner.query(`UPDATE "services" SET "shortDescription" = SUBSTRING("fullDescription", 1, 150)`);

        // Ensure shortDescription is NOT NULL if we want to enforce it at DB level
        // But the rule says it's required to PUBLISH, not necessarily to EXIST in DB (maybe draft?)
        // The user says "Rule: A therapy cannot be published to consumers unless it has category + description + photo."
        // This suggests we can have incomplete therapies that are NOT published (isActive: false).
        // So columns should probably be nullable at DB level if we allow drafts.
        // However, 'description' was already NOT NULL.
        // I'll leave shortDescription nullable for now and enforce it in logic when activating.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "shortDescription"`);
        await queryRunner.query(`ALTER TABLE "services" RENAME COLUMN "fullDescription" TO "description"`);
    }

}
