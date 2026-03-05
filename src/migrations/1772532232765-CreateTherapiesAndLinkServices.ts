import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTherapiesAndLinkServices1772532232765 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create therapies table
        await queryRunner.query(`
            CREATE TABLE "therapies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "shortDescription" text NOT NULL, 
                "fullDescription" text NOT NULL, 
                "category" character varying NOT NULL, 
                "imageUrl" character varying, 
                "isActive" boolean NOT NULL DEFAULT true, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_therapies" PRIMARY KEY ("id")
            )
        `);

        // 2. Extract unique therapies from existing services
        // We use DISTINCT ON (name, category) to ensure we get one therapy per unique pair
        await queryRunner.query(`
            INSERT INTO "therapies" ("name", "shortDescription", "fullDescription", "category", "imageUrl", "isActive")
            SELECT DISTINCT ON ("name", "category") "name", "shortDescription", "fullDescription", "category", "imageUrl", "isActive"
            FROM "services"
        `);

        // 3. Add therapyId to services
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "therapyId" uuid`);

        // 4. Link services to therapies based on name and category
        await queryRunner.query(`
            UPDATE "services" s
            SET "therapyId" = t.id
            FROM "therapies" t
            WHERE s.name = t.name AND s.category = t.category
        `);

        // 5. Make therapyId NOT NULL and add foreign key
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "therapyId" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "services" 
            ADD CONSTRAINT "FK_services_therapy" 
            FOREIGN KEY ("therapyId") REFERENCES "therapies"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // 6. Drop redundant columns from services
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "shortDescription"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "fullDescription"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "imageUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback is harder because we dropped data-containing columns
        // Let's add them back and populate from therapy
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "name" character varying`);
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "shortDescription" text`);
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "fullDescription" text`);
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "category" character varying`);
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "imageUrl" character varying`);

        await queryRunner.query(`
            UPDATE "services" s
            SET "name" = t.name,
                "shortDescription" = t.shortDescription,
                "fullDescription" = t.fullDescription,
                "category" = t.category,
                "imageUrl" = t.imageUrl
            FROM "therapies" t
            WHERE s."therapyId" = t.id
        `);

        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_services_therapy"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "therapyId"`);
        await queryRunner.query(`DROP TABLE "therapies"`);
    }

}
