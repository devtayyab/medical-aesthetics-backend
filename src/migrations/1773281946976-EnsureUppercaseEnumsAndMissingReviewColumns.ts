import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureUppercaseEnumsAndMissingReviewColumns1773281946976 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure action_status_enum includes 'overdue'
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'action_status_enum' AND e.enumlabel = 'overdue') THEN
                    ALTER TYPE "action_status_enum" ADD VALUE 'overdue';
                END IF;
            END $$;
        `);

        // 2. Ensure treatment_status_enum exists in UPPERCASE
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_status_enum') THEN
                    CREATE TYPE "treatment_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
                ELSE
                    -- Add uppercase values just in case it was created with lowercase
                    ALTER TYPE "treatment_status_enum" ADD VALUE IF NOT EXISTS 'PENDING';
                    ALTER TYPE "treatment_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED';
                    ALTER TYPE "treatment_status_enum" ADD VALUE IF NOT EXISTS 'REJECTED';
                END IF;
            END $$;
        `);

        // 3. Ensure review_status_enum exists in UPPERCASE
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
                    CREATE TYPE "review_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
                ELSE
                    -- Add uppercase values just in case it was created with lowercase
                    ALTER TYPE "review_status_enum" ADD VALUE IF NOT EXISTS 'PENDING';
                    ALTER TYPE "review_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED';
                    ALTER TYPE "review_status_enum" ADD VALUE IF NOT EXISTS 'REJECTED';
                END IF;
            END $$;
        `);

        // 4. Update status columns to default to UPPERCASE and add missing ones
        await queryRunner.query(`
            ALTER TABLE "treatment_categories" 
            ADD COLUMN IF NOT EXISTS "status" "treatment_status_enum" NOT NULL DEFAULT 'APPROVED';
            
            -- Fix existing lowercase data to uppercase
            UPDATE "treatment_categories" SET status = 'APPROVED' WHERE status::text = 'approved';
        `);

        await queryRunner.query(`
            ALTER TABLE "treatments" 
            ADD COLUMN IF NOT EXISTS "status" "treatment_status_enum" NOT NULL DEFAULT 'APPROVED';
            
            UPDATE "treatments" SET status = 'APPROVED' WHERE status::text = 'approved';
        `);

        // 5. Add missing review columns
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD COLUMN IF NOT EXISTS "status" "review_status_enum" NOT NULL DEFAULT 'PENDING',
            ADD COLUMN IF NOT EXISTS "approvedById" uuid,
            ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "rejectReason" text;
            
            UPDATE "reviews" SET status = 'APPROVED' WHERE status::text = 'approved';
        `);

        // 6. Ensure ForeignKey for approvedById on reviews
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_reviews_approvedby') THEN
                    ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_approvedby" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> { }

}
