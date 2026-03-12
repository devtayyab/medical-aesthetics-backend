import { MigrationInterface, QueryRunner } from "typeorm";

export class PatchMissingColumnsAndEnums1773281008483 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Fix action_status_enum to include 'overdue'
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'action_status_enum' AND e.enumlabel = 'overdue') THEN
                    ALTER TYPE "action_status_enum" ADD VALUE 'overdue';
                END IF;
            END $$;
        `);

        // 2. Ensure treatment_status_enum exists
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_status_enum') THEN
                    CREATE TYPE "treatment_status_enum" AS ENUM('pending', 'approved', 'rejected');
                END IF;
            END $$;
        `);

        // 3. Ensure review_status_enum exists
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
                    CREATE TYPE "review_status_enum" AS ENUM('pending', 'approved', 'rejected');
                END IF;
            END $$;
        `);

        // 4. Add status column to treatment_categories if missing
        await queryRunner.query(`
            ALTER TABLE "treatment_categories" 
            ADD COLUMN IF NOT EXISTS "status" "treatment_status_enum" NOT NULL DEFAULT 'approved';
        `);

        // 5. Add status column to treatments if missing
        await queryRunner.query(`
            ALTER TABLE "treatments" 
            ADD COLUMN IF NOT EXISTS "status" "treatment_status_enum" NOT NULL DEFAULT 'approved';
        `);

        // 6. Add status column to reviews if missing
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD COLUMN IF NOT EXISTS "status" "review_status_enum" NOT NULL DEFAULT 'pending';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Enums and columns added in up are usually not removed in a "fix-up" patch to avoid data loss
    }

}
