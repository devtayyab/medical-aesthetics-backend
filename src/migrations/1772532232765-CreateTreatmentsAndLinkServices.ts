import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTreatmentsAndLinkServices1772532232765 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create treatments table
        await queryRunner.query(`
            CREATE TABLE "treatments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "shortDescription" text NOT NULL, 
                "fullDescription" text NOT NULL, 
                "category" character varying NOT NULL, 
                "imageUrl" character varying, 
                "isActive" boolean NOT NULL DEFAULT true, 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_treatments" PRIMARY KEY ("id")
            )
        `);

        // Debug: Log columns
        const cols = await queryRunner.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'services'`);
        console.log('Detected columns in services:', cols.map(c => c.column_name));

        // 2. Extract unique treatments from existing services
        await queryRunner.query(`
            INSERT INTO "treatments" ("name", "shortDescription", "fullDescription", "category", "imageUrl", "isActive")
            SELECT DISTINCT ON ("name", "category") "name", "shortDescription", "fullDescription", "category", "imageUrl", "isActive"
            FROM "services"
        `);

        // 3. Add treatmentId to services
        await queryRunner.query(`ALTER TABLE "services" ADD COLUMN "treatmentId" uuid`);

        // 4. Link services to treatments based on name and category
        await queryRunner.query(`
            UPDATE "services" s
            SET "treatmentId" = t.id
            FROM "treatments" t
            WHERE s.name = t.name AND s.category = t.category
        `);

        // 5. Make treatmentId NOT NULL and add foreign key
        await queryRunner.query(`ALTER TABLE "services" ALTER COLUMN "treatmentId" SET NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "services" 
            ADD CONSTRAINT "FK_services_treatment" 
            FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // 6. Drop redundant columns from services
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "shortDescription"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "fullDescription"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "imageUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
            FROM "treatments" t
            WHERE s."treatmentId" = t.id
        `);

        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_services_treatment"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "treatmentId"`);
        await queryRunner.query(`DROP TABLE "treatments"`);
    }

}
