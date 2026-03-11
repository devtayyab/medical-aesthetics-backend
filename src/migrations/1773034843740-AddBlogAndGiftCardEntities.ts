import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlogAndGiftCardEntities1773034843740 implements MigrationInterface {
    name = 'AddBlogAndGiftCardEntities1773034843740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Helper function to check if table exists
        const tableExists = async (tableName: string): Promise<boolean> => {
            const result = await queryRunner.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '${tableName}'
                )`
            );
            return result[0].exists;
        };

        // Helper function to check if type exists
        const typeExists = async (typeName: string): Promise<boolean> => {
            const result = await queryRunner.query(
                `SELECT EXISTS (
                    SELECT FROM pg_type 
                    WHERE typname = '${typeName}'
                )`
            );
            return result[0].exists;
        };

        // 1. Ensure Enums Exist (Defensively)
        if (!(await typeExists('communication_logs_type_enum'))) {
            await queryRunner.query(`CREATE TYPE "public"."communication_logs_type_enum" AS ENUM('call', 'email', 'sms', 'whatsapp', 'meeting', 'note')`);
        }
        if (!(await typeExists('communication_logs_direction_enum'))) {
            await queryRunner.query(`CREATE TYPE "public"."communication_logs_direction_enum" AS ENUM('outgoing', 'incoming', 'missed')`);
        }
        if (!(await typeExists('communication_logs_status_enum'))) {
            await queryRunner.query(`CREATE TYPE "public"."communication_logs_status_enum" AS ENUM('completed', 'missed', 'no_answer', 'voicemail', 'scheduled', 'cancelled')`);
        }

        // 2. Create Blog Categories
        if (!(await tableExists('blog_categories'))) {
            await queryRunner.query(`
                CREATE TABLE "blog_categories" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                    "name" character varying NOT NULL, 
                    "slug" character varying NOT NULL, 
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    CONSTRAINT "PK_blog_categories" PRIMARY KEY ("id")
                )
            `);
        }

        // 3. Create Blog Posts
        if (!(await tableExists('blog_posts'))) {
            await queryRunner.query(`
                CREATE TABLE "blog_posts" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                    "title" character varying NOT NULL, 
                    "slug" character varying NOT NULL, 
                    "content" text NOT NULL, 
                    "imageUrl" character varying, 
                    "isPublished" boolean NOT NULL DEFAULT false, 
                    "scheduledAt" TIMESTAMP, 
                    "categoryId" uuid, 
                    "authorId" uuid, 
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    "publishedAt" TIMESTAMP, 
                    CONSTRAINT "PK_blog_posts" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_blog_posts_slug" ON "blog_posts" ("slug")`);
            await queryRunner.query(`ALTER TABLE "blog_posts" ADD CONSTRAINT "FK_blog_posts_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            await queryRunner.query(`ALTER TABLE "blog_posts" ADD CONSTRAINT "FK_blog_posts_category" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }

        // 4. Create Gift Cards
        if (!(await tableExists('gift_cards'))) {
            await queryRunner.query(`
                CREATE TABLE "gift_cards" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                    "code" character varying NOT NULL, 
                    "amount" numeric(10,2) NOT NULL, 
                    "balance" numeric(10,2) NOT NULL DEFAULT '0', 
                    "isActive" boolean NOT NULL DEFAULT true, 
                    "recipientEmail" character varying, 
                    "message" character varying, 
                    "userId" uuid NOT NULL, 
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    "expiresAt" TIMESTAMP, 
                    CONSTRAINT "PK_gift_cards" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`ALTER TABLE "gift_cards" ADD CONSTRAINT "FK_gift_cards_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasTable("gift_cards")) {
            await queryRunner.query(`ALTER TABLE "gift_cards" DROP CONSTRAINT "FK_gift_cards_user"`);
            await queryRunner.query(`DROP TABLE "gift_cards"`);
        }
        if (await queryRunner.hasTable("blog_posts")) {
            await queryRunner.query(`ALTER TABLE "blog_posts" DROP CONSTRAINT "FK_blog_posts_category"`);
            await queryRunner.query(`ALTER TABLE "blog_posts" DROP CONSTRAINT "FK_blog_posts_author"`);
            await queryRunner.query(`DROP INDEX "IDX_blog_posts_slug"`);
            await queryRunner.query(`DROP TABLE "blog_posts"`);
        }
        if (await queryRunner.hasTable("blog_categories")) {
            await queryRunner.query(`DROP TABLE "blog_categories"`);
        }
    }
}

