import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * - notification_dispatch_log: "sent once" flags for reminders / review requests
 * - contact_messages: stored contact form submissions (admin inbox)
 * - reviews.responseHidden: admin can hide a clinic reply
 * - new notification template triggers (only if the column was created as an enum)
 */
export class NotificationsInboxRemindersReviews1787512345000 implements MigrationInterface {
    name = 'NotificationsInboxRemindersReviews1787512345000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_dispatch_log" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "dispatchKey" character varying(200) NOT NULL,
                "kind" character varying(60) NOT NULL,
                "appointmentId" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_dispatch_log" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_dispatch_log_key" ON "notification_dispatch_log" ("dispatchKey")`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "contact_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(120) NOT NULL,
                "email" character varying(200) NOT NULL,
                "phone" character varying(50),
                "subject" character varying(150) NOT NULL,
                "message" text NOT NULL,
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP WITH TIME ZONE,
                "readById" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_contact_messages" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contact_messages_isRead" ON "contact_messages" ("isRead")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contact_messages_createdAt" ON "contact_messages" ("createdAt")`);

        await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "responseHidden" boolean NOT NULL DEFAULT false`);

        // Bell queries: own notifications, newest first, unread count
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_recipient_type_created" ON "notifications" ("recipientId", "type", "createdAt")`);

        // If an environment created notification_templates.trigger as an enum (synchronize),
        // add the new values; with the varchar column from the migrations nothing is needed.
        const enumType = await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname = 'notification_templates_trigger_enum'`);
        if (enumType.length > 0) {
            for (const value of [
                'APPOINTMENT_REMINDER_SAME_DAY',
                'REVIEW_REQUEST',
                'PAYMENT_RECEIPT',
                'REFUND_ISSUED',
                'CLINIC_NEW_APPOINTMENT',
                'CLINIC_APPOINTMENT_CANCELLED',
                'ADMIN_ALERT',
            ]) {
                await queryRunner.query(`ALTER TYPE "notification_templates_trigger_enum" ADD VALUE IF NOT EXISTS '${value}'`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_recipient_type_created"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "responseHidden"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notification_dispatch_log"`);
    }
}
