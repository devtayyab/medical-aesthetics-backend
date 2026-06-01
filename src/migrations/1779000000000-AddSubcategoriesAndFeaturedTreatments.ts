import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubcategoriesAndFeaturedTreatments1779000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- treatment_categories: self-referencing parent + sort order ---
        const catColumns = await queryRunner.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'treatment_categories'`
        );
        const catColumnNames = catColumns.map((c: any) => c.column_name);

        if (!catColumnNames.includes('parentId')) {
            await queryRunner.query(`ALTER TABLE "treatment_categories" ADD COLUMN "parentId" uuid`);
        }
        if (!catColumnNames.includes('sortOrder')) {
            await queryRunner.query(`ALTER TABLE "treatment_categories" ADD COLUMN "sortOrder" integer NOT NULL DEFAULT 0`);
        }

        const parentFkExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'FK_treatment_categories_parent'
        `);
        if (parentFkExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "treatment_categories"
                ADD CONSTRAINT "FK_treatment_categories_parent"
                FOREIGN KEY ("parentId") REFERENCES "treatment_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);
        }

        // --- treatments: featured flag + sort order ---
        const tColumns = await queryRunner.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'treatments'`
        );
        const tColumnNames = tColumns.map((c: any) => c.column_name);

        if (!tColumnNames.includes('isFeatured')) {
            await queryRunner.query(`ALTER TABLE "treatments" ADD COLUMN "isFeatured" boolean NOT NULL DEFAULT false`);
        }
        if (!tColumnNames.includes('sortOrder')) {
            await queryRunner.query(`ALTER TABLE "treatments" ADD COLUMN "sortOrder" integer NOT NULL DEFAULT 0`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treatments" DROP COLUMN IF EXISTS "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "treatments" DROP COLUMN IF EXISTS "isFeatured"`);
        await queryRunner.query(`ALTER TABLE "treatment_categories" DROP CONSTRAINT IF EXISTS "FK_treatment_categories_parent"`);
        await queryRunner.query(`ALTER TABLE "treatment_categories" DROP COLUMN IF EXISTS "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "treatment_categories" DROP COLUMN IF EXISTS "parentId"`);
    }
}
