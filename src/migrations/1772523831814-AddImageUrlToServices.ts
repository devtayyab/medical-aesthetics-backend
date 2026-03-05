import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToServices1772523831814 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add imageUrl column
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "imageUrl" character varying`);

        // Set default category for existing records that might have NULL
        await queryRunner.query(`UPDATE "services" SET "category" = 'Other' WHERE "category" IS NULL`);

        // Make category non-nullable
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "category" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "imageUrl"`);
    }

}
