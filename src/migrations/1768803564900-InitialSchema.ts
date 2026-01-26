import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1768803564900 implements MigrationInterface {
    name = 'InitialSchema1768803564900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "color" character varying, "description" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_type_enum" AS ENUM('follow_up_call', 'email_follow_up', 'appointment_reminder', 'treatment_follow_up', 'loyalty_reward', 'general')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "type" "public"."tasks_type_enum" NOT NULL DEFAULT 'general', "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending', "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL, "assigneeId" uuid, "customerId" uuid, "metadata" json, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."leads_status_enum" AS ENUM('new', 'contacted', 'qualified', 'appointment_scheduled', 'converted', 'lost', 'follow_up', 'merged')`);
        await queryRunner.query(`CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "facebookLeadId" character varying, "facebookFormId" character varying, "facebookCampaignId" character varying, "facebookAdSetId" character varying, "facebookAdId" character varying, "facebookLeadData" json, "phone" character varying, "status" "public"."leads_status_enum" NOT NULL DEFAULT 'new', "notes" text, "assignedSalesId" uuid, "metadata" json, "estimatedValue" numeric(10,2), "lastContactedAt" TIMESTAMP WITH TIME ZONE, "convertedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_b3eea7add0e16594dba102716c5" UNIQUE ("email"), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "durationMinutes" integer NOT NULL, "category" character varying, "metadata" json, "isActive" boolean NOT NULL DEFAULT true, "clinicId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clinics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "address" json NOT NULL, "phone" character varying, "email" character varying, "website" character varying, "businessHours" json, "timezone" character varying, "isActive" boolean NOT NULL DEFAULT true, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5513b659e4d12b01a8ab3956abc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinicId" uuid NOT NULL, "serviceId" uuid NOT NULL, "providerId" uuid NOT NULL, "clientId" uuid NOT NULL, "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'pending', "notes" text, "paymentMethod" character varying, "advancePaymentAmount" numeric(10,2), "totalAmount" numeric(10,2), "holdId" character varying, "treatmentDetails" json, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "loyalty_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "clinicId" uuid, "points" integer NOT NULL, "transactionType" character varying NOT NULL, "description" text, "metadata" json, "appointmentId" character varying, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f7347ecfcc3c05bd1c44b3d32a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('push', 'sms', 'viber', 'email')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recipientId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "data" json, "isRead" boolean NOT NULL DEFAULT false, "isSent" boolean NOT NULL DEFAULT false, "sentAt" TIMESTAMP WITH TIME ZONE, "readAt" TIMESTAMP WITH TIME ZONE, "externalId" character varying, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'SUPER_ADMIN', 'clinic_owner', 'doctor', 'secretariat', 'salesperson', 'client')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'client', "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying, "profile" json, "profilePictureUrl" character varying, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "isActive" boolean NOT NULL DEFAULT true, "referralCode" character varying, "referredById" uuid, "refreshToken" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899" UNIQUE ("referralCode"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_type_enum" AS ENUM('call', 'email', 'sms', 'whatsapp', 'meeting', 'note')`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_direction_enum" AS ENUM('outgoing', 'incoming', 'missed')`);
        await queryRunner.query(`CREATE TYPE "public"."communication_logs_status_enum" AS ENUM('completed', 'missed', 'no_answer', 'voicemail', 'scheduled', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "communication_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" uuid NOT NULL, "salespersonId" uuid NOT NULL, "type" "public"."communication_logs_type_enum" NOT NULL, "direction" "public"."communication_logs_direction_enum", "status" "public"."communication_logs_status_enum" NOT NULL DEFAULT 'completed', "subject" text NOT NULL, "notes" text, "durationSeconds" integer, "scheduledAt" TIMESTAMP WITH TIME ZONE, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d20f31e44aa2108bd47d7a6f781" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" uuid NOT NULL, "tagId" uuid NOT NULL, "addedBy" uuid, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_339dae325423407628d43e023bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ad_campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "platform" character varying(50) NOT NULL, "channel" character varying(255) NOT NULL, "externalId" character varying(255) NOT NULL, "ownerAgentId" uuid, "name" character varying(255) NOT NULL, "budget" numeric(12,2) NOT NULL DEFAULT '0', "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7877713eb87f782dd190eed85a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_389771d6eb1e44bb0b562e6237" ON "ad_campaigns" ("platform") `);
        await queryRunner.query(`CREATE INDEX "IDX_1310aa7cd0f2519090f899ff1e" ON "ad_campaigns" ("externalId") `);
        await queryRunner.query(`CREATE INDEX "IDX_45c23fb387d541458f8e996035" ON "ad_campaigns" ("ownerAgentId") `);
        await queryRunner.query(`CREATE TABLE "ad_attributions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerRecordId" uuid NOT NULL, "adCampaignId" uuid NOT NULL, "firstInteractionAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastInteractionAt" TIMESTAMP WITH TIME ZONE NOT NULL, "interactionCount" integer NOT NULL DEFAULT '1', "converted" boolean NOT NULL DEFAULT false, "convertedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1caa02abe09eddb10028afaa222" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."customer_records_customerstatus_enum" AS ENUM('new', 'contacted', 'qualified', 'active', 'inactive', 'vip')`);
        await queryRunner.query(`CREATE TABLE "customer_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" uuid NOT NULL, "assignedSalespersonId" uuid, "customerStatus" "public"."customer_records_customerstatus_enum" NOT NULL DEFAULT 'new', "lifetimeValue" numeric(10,2) NOT NULL DEFAULT '0', "totalAppointments" integer NOT NULL DEFAULT '0', "completedAppointments" integer NOT NULL DEFAULT '0', "cancelledAppointments" integer NOT NULL DEFAULT '0', "lastAppointmentDate" TIMESTAMP WITH TIME ZONE, "nextAppointmentDate" TIMESTAMP WITH TIME ZONE, "lastContactDate" TIMESTAMP WITH TIME ZONE, "averageDaysBetweenVisits" integer, "preferences" json, "treatmentHistory" json, "preferredClinicId" character varying, "preferredDoctorId" character varying, "clinicHistory" json, "doctorHistory" json, "lastClinicId" character varying, "lastDoctorId" character varying, "treatmentPreferences" json, "isRepeatCustomer" boolean NOT NULL DEFAULT false, "notes" character varying, "repeatCount" character varying, "expectedNextVisit" date, "facebookCampaignId" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_720bc01e02237a56f8f885b7c41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "crm_actions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "customerId" uuid NOT NULL,
            ...
            CONSTRAINT "PK_bc9e830bf56a752b67420895809" PRIMARY KEY ("id")
        )`);
        
        await queryRunner.query(`
            DELETE FROM "crm_actions"
            WHERE "customerId" NOT IN (
                SELECT "id" FROM "customer_records"
            );
        `);
        
        await queryRunner.query(`
            ALTER TABLE "crm_actions"
            ADD CONSTRAINT "FK_0d50d9c8f5727b366a284104b71"
            FOREIGN KEY ("customerId") REFERENCES "customer_records"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`CREATE TYPE "public"."crm_actions_actiontype_enum" AS ENUM('phone_call', 'email', 'follow_up', 'appointment_confirmation', 'meeting', 'treatment_reminder')`);
        await queryRunner.query(`CREATE TYPE "public"."crm_actions_status_enum" AS ENUM('pending', 'completed', 'cancelled', 'missed')`);
        await queryRunner.query(`CREATE TYPE "public"."crm_actions_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."crm_actions_calloutcome_enum" AS ENUM('successful', 'failed', 'pending')`);
        await queryRunner.query(`CREATE TABLE "crm_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" uuid NOT NULL, "salespersonId" uuid NOT NULL, "actionType" "public"."crm_actions_actiontype_enum" NOT NULL, "title" character varying NOT NULL, "description" text, "status" "public"."crm_actions_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."crm_actions_priority_enum" NOT NULL DEFAULT 'medium', "dueDate" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "relatedAppointmentId" uuid, "relatedLeadId" uuid, "clinic" character varying, "proposedTreatment" character varying, "callOutcome" "public"."crm_actions_calloutcome_enum", "cost" numeric, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bc9e830bf56a752b67420895809" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying, "action" character varying NOT NULL, "resource" character varying NOT NULL, "resourceId" character varying, "data" json, "changes" json, "ip" character varying, "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_62fd8c2a24d920f1f23aa312e3" ON "audit_logs" ("resource", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_99e589da8f9e9326ee0d01a028" ON "audit_logs" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "consent_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "consentType" character varying NOT NULL, "version" character varying NOT NULL, "granted" boolean NOT NULL, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_030be152eaa44998166470b2ccc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointment_holds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinicId" character varying NOT NULL, "serviceId" character varying NOT NULL, "providerId" character varying NOT NULL, "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endTime" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "clientId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_43a358fb879ff7a7a878262752a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lead_tags" ("leadId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "PK_130f0edfe14b6ce6a8d238eb84a" PRIMARY KEY ("leadId", "tagId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_113b3f1b26fc2e3deb2eb9fe1a" ON "lead_tags" ("leadId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba17e62b98176a43e1703b9b45" ON "lead_tags" ("tagId") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_27b517d1d7a2efe28177e98fdba" FOREIGN KEY ("customerId") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_3a30b5301edbd2e57e032961e9f" FOREIGN KEY ("assignedSalesId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_72299eb2e42a1f560d44be97d04" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clinics" ADD CONSTRAINT "FK_3117a13727ec3247fa47cc40e95" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_040a7ee2072d45bc98efddf3c02" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_f77953c373efb8ab146d98e90c3" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_2428e01f899c4edb909e8798b63" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_c4dbd8eb292b83b5dc67be3cf45" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "FK_7cf5739ef8c93bdaa98b5dca07e" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "FK_5bfebb90af9317731de682e6673" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ADD CONSTRAINT "FK_4992b11665bf79df55c6afde4da" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communication_logs" ADD CONSTRAINT "FK_fcd6b2cb16b4efdd745e426a021" FOREIGN KEY ("salespersonId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_tags" ADD CONSTRAINT "FK_8b2101f9c8689c8ec8a0e4469c2" FOREIGN KEY ("customerId") REFERENCES "customer_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_tags" ADD CONSTRAINT "FK_d52f7d2360abb04a9a966a6a268" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_tags" ADD CONSTRAINT "FK_4f77ce6ee0977b68f3ec8b3cfe2" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ad_attributions" ADD CONSTRAINT "FK_197fb1f1c0a0e6110c378131e26" FOREIGN KEY ("customerRecordId") REFERENCES "customer_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ad_attributions" ADD CONSTRAINT "FK_cef8e1c355b902ed1b9f6cfec53" FOREIGN KEY ("adCampaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_records" ADD CONSTRAINT "FK_dd1116d15dae5959ad992a6707d" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_records" ADD CONSTRAINT "FK_2809b570ecddeed52cd2d4058e7" FOREIGN KEY ("assignedSalespersonId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "crm_actions" ADD CONSTRAINT "FK_0d50d9c8f5727b366a284104b71" FOREIGN KEY ("customerId") REFERENCES "customer_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "crm_actions" ADD CONSTRAINT "FK_7b670798feb3196663f9a581cc9" FOREIGN KEY ("salespersonId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consent_records" ADD CONSTRAINT "FK_325a36bd104daa11a3d4542afa9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lead_tags" ADD CONSTRAINT "FK_113b3f1b26fc2e3deb2eb9fe1a2" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "lead_tags" ADD CONSTRAINT "FK_ba17e62b98176a43e1703b9b45a" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lead_tags" DROP CONSTRAINT "FK_ba17e62b98176a43e1703b9b45a"`);
        await queryRunner.query(`ALTER TABLE "lead_tags" DROP CONSTRAINT "FK_113b3f1b26fc2e3deb2eb9fe1a2"`);
        await queryRunner.query(`ALTER TABLE "consent_records" DROP CONSTRAINT "FK_325a36bd104daa11a3d4542afa9"`);
        await queryRunner.query(`ALTER TABLE "crm_actions" DROP CONSTRAINT "FK_7b670798feb3196663f9a581cc9"`);
        await queryRunner.query(`ALTER TABLE "crm_actions" DROP CONSTRAINT "FK_0d50d9c8f5727b366a284104b71"`);
        await queryRunner.query(`ALTER TABLE "customer_records" DROP CONSTRAINT "FK_2809b570ecddeed52cd2d4058e7"`);
        await queryRunner.query(`ALTER TABLE "customer_records" DROP CONSTRAINT "FK_dd1116d15dae5959ad992a6707d"`);
        await queryRunner.query(`ALTER TABLE "ad_attributions" DROP CONSTRAINT "FK_cef8e1c355b902ed1b9f6cfec53"`);
        await queryRunner.query(`ALTER TABLE "ad_attributions" DROP CONSTRAINT "FK_197fb1f1c0a0e6110c378131e26"`);
        await queryRunner.query(`ALTER TABLE "customer_tags" DROP CONSTRAINT "FK_4f77ce6ee0977b68f3ec8b3cfe2"`);
        await queryRunner.query(`ALTER TABLE "customer_tags" DROP CONSTRAINT "FK_d52f7d2360abb04a9a966a6a268"`);
        await queryRunner.query(`ALTER TABLE "customer_tags" DROP CONSTRAINT "FK_8b2101f9c8689c8ec8a0e4469c2"`);
        await queryRunner.query(`ALTER TABLE "communication_logs" DROP CONSTRAINT "FK_fcd6b2cb16b4efdd745e426a021"`);
        await queryRunner.query(`ALTER TABLE "communication_logs" DROP CONSTRAINT "FK_4992b11665bf79df55c6afde4da"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1142607b5a447cd5ce23ef7798f"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`);
        await queryRunner.query(`ALTER TABLE "loyalty_ledger" DROP CONSTRAINT "FK_5bfebb90af9317731de682e6673"`);
        await queryRunner.query(`ALTER TABLE "loyalty_ledger" DROP CONSTRAINT "FK_7cf5739ef8c93bdaa98b5dca07e"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_c4dbd8eb292b83b5dc67be3cf45"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_2428e01f899c4edb909e8798b63"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_f77953c373efb8ab146d98e90c3"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_040a7ee2072d45bc98efddf3c02"`);
        await queryRunner.query(`ALTER TABLE "clinics" DROP CONSTRAINT "FK_3117a13727ec3247fa47cc40e95"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_72299eb2e42a1f560d44be97d04"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_3a30b5301edbd2e57e032961e9f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_27b517d1d7a2efe28177e98fdba"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba17e62b98176a43e1703b9b45"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_113b3f1b26fc2e3deb2eb9fe1a"`);
        await queryRunner.query(`DROP TABLE "lead_tags"`);
        await queryRunner.query(`DROP TABLE "appointment_holds"`);
        await queryRunner.query(`DROP TABLE "consent_records"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99e589da8f9e9326ee0d01a028"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_62fd8c2a24d920f1f23aa312e3"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "crm_actions"`);
        await queryRunner.query(`DROP TYPE "public"."crm_actions_calloutcome_enum"`);
        await queryRunner.query(`DROP TYPE "public"."crm_actions_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."crm_actions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."crm_actions_actiontype_enum"`);
        await queryRunner.query(`DROP TABLE "customer_records"`);
        await queryRunner.query(`DROP TYPE "public"."customer_records_customerstatus_enum"`);
        await queryRunner.query(`DROP TABLE "ad_attributions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45c23fb387d541458f8e996035"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1310aa7cd0f2519090f899ff1e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_389771d6eb1e44bb0b562e6237"`);
        await queryRunner.query(`DROP TABLE "ad_campaigns"`);
        await queryRunner.query(`DROP TABLE "customer_tags"`);
        await queryRunner.query(`DROP TABLE "communication_logs"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_direction_enum"`);
        await queryRunner.query(`DROP TYPE "public"."communication_logs_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "loyalty_ledger"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
        await queryRunner.query(`DROP TABLE "clinics"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "leads"`);
        await queryRunner.query(`DROP TYPE "public"."leads_status_enum"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_type_enum"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
