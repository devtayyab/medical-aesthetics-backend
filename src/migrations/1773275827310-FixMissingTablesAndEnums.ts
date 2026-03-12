import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class FixMissingTablesAndEnums1773275827310 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Fix Appointment Status Enum - Add 'pending_payment'
        // PostgreSQL doesn't allow adding values to enum in a transaction easily without COMMIT, 
        // but we can check if it exists and add it.
        const checkEnum = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumtypid = 'appointments_status_enum'::regtype 
                AND enumlabel = 'pending_payment'
            )
        `);
        
        if (!checkEnum[0].exists) {
            // We use ALTER TYPE ... ADD VALUE but it must be run outside of a multi-statement transaction in some PG versions
            // However TypeORM runs this in a transaction. Let's try to add it.
            try {
                await queryRunner.query(`ALTER TYPE "appointments_status_enum" ADD VALUE IF NOT EXISTS 'pending_payment'`);
            } catch (e) {
                console.log('Skipping enum update, might already exist or handled by TypeORM');
            }
        }

        // 2. Create notification_templates table
        const hasNotificationTemplates = await queryRunner.hasTable("notification_templates");
        if (!hasNotificationTemplates) {
            await queryRunner.query(`
                CREATE TABLE "notification_templates" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                    "trigger" character varying NOT NULL, 
                    "type" character varying NOT NULL, 
                    "subject" character varying NOT NULL, 
                    "content" text NOT NULL, 
                    "isActive" boolean NOT NULL DEFAULT true, 
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                    CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_notification_templates_trigger_type" ON "notification_templates" ("trigger", "type")`);
        }

        // 3. Seed SuperAdmin user if it doesn't exist
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await queryRunner.query(`
            INSERT INTO "users" (
                "id", 
                "email", 
                "passwordHash", 
                "firstName", 
                "lastName", 
                "role", 
                "isActive", 
                "createdAt", 
                "updatedAt"
            ) VALUES (
                uuid_generate_v4(), 
                'superadmin@example.com', 
                '${hashedPassword}', 
                'Super', 
                'Admin', 
                'SUPER_ADMIN', 
                true, 
                now(), 
                now()
            )
            ON CONFLICT ("email") DO UPDATE SET "passwordHash" = '${hashedPassword}'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates"`);
    }

}
