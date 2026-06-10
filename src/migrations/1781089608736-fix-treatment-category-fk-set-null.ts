import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SAFE migration: only fixes treatments.categoryId FK to ON DELETE SET NULL.
 * Uses IF EXISTS to avoid failure if constraint names differ between environments.
 */
export class FixTreatmentCategoryFkSetNull1781089608736 implements MigrationInterface {
    name = 'FixTreatmentCategoryFkSetNull1781089608736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop ALL existing FKs on treatments.categoryId regardless of their auto-generated name
        await queryRunner.query(`
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN
                    SELECT tc.constraint_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    WHERE tc.table_schema = 'public'
                      AND tc.table_name = 'treatments'
                      AND tc.constraint_type = 'FOREIGN KEY'
                      AND kcu.column_name = 'categoryId'
                LOOP
                    EXECUTE 'ALTER TABLE treatments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                END LOOP;
            END
            $$;
        `);

        // Re-add the FK with ON DELETE SET NULL
        await queryRunner.query(`
            ALTER TABLE "treatments"
            ADD CONSTRAINT "FK_treatments_categoryId_set_null"
            FOREIGN KEY ("categoryId")
            REFERENCES "treatment_categories"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "treatments" DROP CONSTRAINT IF EXISTS "FK_treatments_categoryId_set_null";
        `);

        await queryRunner.query(`
            ALTER TABLE "treatments"
            ADD CONSTRAINT "FK_treatments_categoryId_set_null"
            FOREIGN KEY ("categoryId")
            REFERENCES "treatment_categories"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
        `);
    }
}
