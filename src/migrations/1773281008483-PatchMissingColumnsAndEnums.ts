import { MigrationInterface, QueryRunner } from "typeorm";

export class PatchMissingColumnsAndEnums1773281008483 implements MigrationInterface {
    transaction = false;

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Fix action_status_enum to include 'overdue'
        // 1. Fix action_status_enum to include 'overdue' if it exists
        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status_enum') THEN
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'action_status_enum' AND e.enumlabel = 'overdue') THEN
                        EXECUTE 'ALTER TYPE "action_status_enum" ADD VALUE ''overdue''';
                    END IF;
                END IF;
            END $$;
        `);

        // 2. Ensure treatment_status_enum exists (UPPERCASE)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_status_enum') THEN
                    CREATE TYPE "treatment_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
                ELSE
                    -- In case it was created with lowercase by mistake
                    ALTER TYPE "treatment_status_enum" ADD VALUE IF NOT EXISTS 'PENDING';
                    ALTER TYPE "treatment_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED';
                    ALTER TYPE "treatment_status_enum" ADD VALUE IF NOT EXISTS 'REJECTED';
                END IF;
            END $$;
        `);

        // 3. Ensure review_status_enum exists (UPPERCASE)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
                    CREATE TYPE "review_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
                ELSE
                    -- In case it was created with lowercase by mistake
                    ALTER TYPE "review_status_enum" ADD VALUE IF NOT EXISTS 'PENDING';
                    ALTER TYPE "review_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED';
                    ALTER TYPE "review_status_enum" ADD VALUE IF NOT EXISTS 'REJECTED';
                END IF;
            END $$;
        `);

        // 4. Add status column to treatment_categories if missing
        await queryRunner.query(`
            ALTER TABLE "treatment_categories" 
            ADD COLUMN IF NOT EXISTS "status" "treatment_status_enum" NOT NULL DEFAULT 'APPROVED';
        `);

        // 5. Add status column to treatments if missing
        await queryRunner.query(`
            ALTER TABLE "treatments" 
            ADD COLUMN IF NOT EXISTS "status" "treatment_status_enum" NOT NULL DEFAULT 'APPROVED';
        `);

        // 6. Add columns to reviews if missing
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD COLUMN IF NOT EXISTS "status" "review_status_enum" NOT NULL DEFAULT 'PENDING',
            ADD COLUMN IF NOT EXISTS "approvedById" uuid,
            ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "rejectReason" text;
        `);

        // 7. Ensure ForeignKey for approvedById on reviews
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_reviews_approvedBy') THEN
                    ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_approvedBy" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Fix-up patch
    }

}
