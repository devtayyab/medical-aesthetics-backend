import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReviewsTable1769600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "reviews" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "clinicId" uuid NOT NULL,
                "clientId" uuid NOT NULL,
                "appointmentId" uuid,
                "rating" integer NOT NULL,
                "comment" text,
                "isVisible" boolean NOT NULL DEFAULT true,
                "response" character varying,
                "respondedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id")
            )
        `);

        // Add constraints after table creation to avoid errors if table existed but constraints didn't
        // We use safe alter table commands

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_reviews_clinicId') THEN
                    ALTER TABLE "reviews" 
                    ADD CONSTRAINT "FK_reviews_clinicId" 
                    FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_reviews_clientId') THEN
                    ALTER TABLE "reviews"
                    ADD CONSTRAINT "FK_reviews_clientId"
                    FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_reviews_appointmentId') THEN
                    ALTER TABLE "reviews"
                    ADD CONSTRAINT "FK_reviews_appointmentId"
                    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_appointmentId"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_clientId"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_clinicId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    }
}
