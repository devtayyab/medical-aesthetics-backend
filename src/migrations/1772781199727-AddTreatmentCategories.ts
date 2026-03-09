import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTreatmentCategories1772781199727 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create treatment_categories table if not exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "treatment_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "description" text, 
                "icon" character varying, 
                "isActive" boolean NOT NULL DEFAULT true, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_treatment_categories" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_treatment_categories_name" UNIQUE ("name")
            )
        `);

        // 2. Add categoryId and status to treatments if they don't exist
        const typeExists = await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname = 'treatment_status_enum'`);
        if (typeExists.length === 0) {
            await queryRunner.query(`CREATE TYPE "treatment_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        }

        const columns = await queryRunner.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'treatments'`);
        const columnNames = columns.map(c => c.column_name);

        if (!columnNames.includes('categoryId')) {
            await queryRunner.query(`ALTER TABLE "treatments" ADD COLUMN "categoryId" uuid`);
        }
        if (!columnNames.includes('status')) {
            await queryRunner.query(`ALTER TABLE "treatments" ADD COLUMN "status" "treatment_status_enum" NOT NULL DEFAULT 'approved'`);
        }

        // Add FK if not exists
        const fkExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_treatments_category'
        `);
        if (fkExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "treatments" 
                ADD CONSTRAINT "FK_treatments_category" 
                FOREIGN KEY ("categoryId") REFERENCES "treatment_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            `);
        }

        // 3. Seed default categories (with ON CONFLICT DO NOTHING)
        const categories = [
            { name: 'Hair Removal', description: 'Laser and IPL hair removal treatments' },
            { name: 'Injectables', description: 'Fillers, Botox, and other injectable treatments' },
            { name: 'Skin Care', description: 'Facials, peels, and dermatological treatments' },
            { name: 'Body', description: 'Body contouring and cellulite treatments' },
            { name: 'Surgery', description: 'Esthetic surgical procedures' },
            { name: 'Dental', description: 'Cosmetic dentistry' },
            { name: 'Other', description: 'Miscellaneous treatments' }
        ];

        for (const cat of categories) {
            await queryRunner.query(
                `INSERT INTO "treatment_categories" ("name", "description") VALUES ($1, $2) ON CONFLICT ("name") DO NOTHING`,
                [cat.name, cat.description]
            );
        }

        // 4. Link existing treatments to newly created categories
        await queryRunner.query(`
            UPDATE "treatments" t
            SET "categoryId" = c.id
            FROM "treatment_categories" c
            WHERE t.category = c.name AND t."categoryId" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treatments" DROP CONSTRAINT "FK_treatments_category"`);
        await queryRunner.query(`ALTER TABLE "treatments" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "treatments" DROP COLUMN "categoryId"`);
        await queryRunner.query(`DROP TYPE "treatment_status_enum"`);
        await queryRunner.query(`DROP TABLE "treatment_categories"`);
    }

}
