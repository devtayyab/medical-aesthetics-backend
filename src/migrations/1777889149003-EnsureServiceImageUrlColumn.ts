import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureServiceImageUrlColumn1777889149003 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists first to avoid error
        const hasColumn = await queryRunner.hasColumn("services", "imageUrl");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "imageUrl" character varying`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("services", "imageUrl");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "imageUrl"`);
        }
    }

}
