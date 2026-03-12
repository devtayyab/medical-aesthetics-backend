import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureAllAdminAndClinicTablesExist1773279983999 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums creation with "IF NOT EXISTS" logic
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_records_method_enum') THEN
                    CREATE TYPE "payment_records_method_enum" AS ENUM('cash', 'pos', 'viva_wallet', 'online_deposit', 'gift_card');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_records_type_enum') THEN
                    CREATE TYPE "payment_records_type_enum" AS ENUM('payment', 'refund', 'deposit', 'void');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_records_status_enum') THEN
                    CREATE TYPE "payment_records_status_enum" AS ENUM('completed', 'pending', 'failed', 'refunded', 'voided');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status_enum') THEN
                    CREATE TYPE "review_status_enum" AS ENUM('pending', 'approved', 'rejected');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_status_enum') THEN
                    CREATE TYPE "treatment_status_enum" AS ENUM('pending', 'approved', 'rejected');
                END IF;
            END $$;
        `);

        // 1. platform_settings
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "platform_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "key" character varying NOT NULL, 
                "value" json NOT NULL, 
                "description" text, 
                "category" character varying NOT NULL DEFAULT 'system',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_platform_settings" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_platform_settings_key" UNIQUE ("key")
            )
        `);

        // 2. payment_records
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payment_records" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "appointmentId" uuid, 
                "clinicId" uuid NOT NULL, 
                "clientId" uuid NOT NULL, 
                "providerId" uuid, 
                "salespersonId" uuid, 
                "amount" numeric(10,2) NOT NULL, 
                "currency" character varying NOT NULL DEFAULT 'EUR', 
                "method" "payment_records_method_enum" NOT NULL, 
                "type" "payment_records_type_enum" NOT NULL DEFAULT 'payment', 
                "status" "payment_records_status_enum" NOT NULL DEFAULT 'completed', 
                "transactionReference" character varying, 
                "notes" text, 
                "metadata" json, 
                "recordedById" uuid, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_payment_records" PRIMARY KEY ("id")
            )
        `);

        // 3. treatment_categories
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

        // 4. treatments
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "treatments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "shortDescription" text NOT NULL, 
                "fullDescription" text NOT NULL, 
                "category" character varying NOT NULL, 
                "categoryId" uuid,
                "imageUrl" character varying, 
                "status" "treatment_status_enum" NOT NULL DEFAULT 'approved',
                "isActive" boolean NOT NULL DEFAULT true, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_treatments" PRIMARY KEY ("id")
            )
        `);

        // 5. reviews
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "reviews" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "clinicId" uuid NOT NULL, 
                "clientId" uuid NOT NULL, 
                "appointmentId" uuid, 
                "rating" integer NOT NULL, 
                "comment" text, 
                "status" "review_status_enum" NOT NULL DEFAULT 'pending', 
                "approvedById" uuid, 
                "approvedAt" TIMESTAMP, 
                "rejectReason" text, 
                "response" text, 
                "respondedAt" TIMESTAMP, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
            )
        `);

        // 6. offers
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "offers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "title" character varying NOT NULL, 
                "description" text NOT NULL, 
                "code" character varying, 
                "discountAmount" numeric(10,2), 
                "discountPercentage" integer, 
                "discountType" character varying NOT NULL DEFAULT 'percentage', 
                "startDate" date NOT NULL, 
                "endDate" date NOT NULL, 
                "isActive" boolean NOT NULL DEFAULT true, 
                "targetAudience" character varying, 
                "usageLimit" integer, 
                "usageCount" integer NOT NULL DEFAULT 0, 
                "applicableServices" json, 
                "applicableClinics" json, 
                "minPurchaseAmount" numeric(10,2), 
                "termsAndConditions" text, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_offers" PRIMARY KEY ("id")
            )
        `);

        // 7. rewards
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "rewards" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "description" text NOT NULL, 
                "pointsCost" integer NOT NULL, 
                "rewardType" character varying NOT NULL DEFAULT 'discount', 
                "value" numeric(10,2), 
                "isActive" boolean NOT NULL DEFAULT true, 
                "tier" character varying, 
                "stockQuantity" integer, 
                "redeemedCount" integer NOT NULL DEFAULT 0, 
                "applicableServices" json, 
                "applicableClinics" json, 
                "expiryDate" date, 
                "termsAndConditions" text, 
                "imageUrl" character varying, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_rewards" PRIMARY KEY ("id")
            )
        `);

        // 8. agent_clinic_access (junction table)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "agent_clinic_access" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "agentUserId" uuid NOT NULL, 
                "clinicId" uuid NOT NULL, 
                CONSTRAINT "PK_agent_clinic_access" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_agent_clinic_access" UNIQUE ("agentUserId", "clinicId")
            )
        `);

        // Seed default Platform Settings if empty
        const settingsCount = await queryRunner.query(`SELECT COUNT(*) FROM "platform_settings"`);
        if (parseInt(settingsCount[0].count) === 0) {
            await queryRunner.query(`
                INSERT INTO "platform_settings" ("key", "value", "category") VALUES 
                ('loyaltyPointsPerDollar', '1', 'loyalty'),
                ('pointsExpirationMonths', '12', 'loyalty'),
                ('appointmentReminderHours', '24', 'notifications'),
                ('meta_ingestion_enabled', 'true', 'system'),
                ('viva_stripe_mode', '"test"', 'payments'),
                ('hubspot_sync_enabled', 'false', 'system'),
                ('google_calendar_sync_enabled', 'false', 'system')
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We generally don't drop everything in down if we use "CREATE IF NOT EXISTS"
        // But for completeness of the migration:
        await queryRunner.query(`DROP TABLE IF EXISTS "agent_clinic_access"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "rewards"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "offers"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "treatments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "treatment_categories"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings"`);
        // payment_records might have data, so be careful. 
        // But this is a fix-up migration.
    }

}
