-- Medical Aesthetics Platform - CRM Database Migration
-- Raw SQL commands for PostgreSQL console execution
-- Run these commands in your PostgreSQL Docker container

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

-- CRM Action Types
CREATE TYPE "action_type_enum" AS ENUM (
  'phone_call',
  'follow_up',
  'appointment_scheduled',
  'email_sent',
  'meeting',
  'update',
  'other'
);

-- CRM Action Status
CREATE TYPE "action_status_enum" AS ENUM (
  'pending',
  'completed',
  'cancelled',
  'missed'
);

-- CRM Action Priority
CREATE TYPE "action_priority_enum" AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Communication Types
CREATE TYPE "communication_type_enum" AS ENUM (
  'call',
  'email',
  'sms',
  'whatsapp',
  'meeting',
  'note'
);

-- Communication Direction
CREATE TYPE "communication_direction_enum" AS ENUM (
  'outgoing',
  'incoming',
  'missed'
);

-- Communication Status
CREATE TYPE "communication_status_enum" AS ENUM (
  'completed',
  'missed',
  'no_answer',
  'voicemail',
  'scheduled',
  'cancelled'
);

-- Customer Status
CREATE TYPE "customer_status_enum" AS ENUM (
  'new',
  'contacted',
  'qualified',
  'active',
  'inactive',
  'vip'
);

-- =====================================================
-- 2. CREATE JUNCTION TABLE FOR LEAD TAGS
-- =====================================================

CREATE TABLE "lead_tags" (
    "leadId" uuid NOT NULL,
    "tagId" uuid NOT NULL,
    CONSTRAINT "PK_lead_tags" PRIMARY KEY ("leadId", "tagId")
);

-- Add foreign key constraints
ALTER TABLE "lead_tags" ADD CONSTRAINT "FK_lead_tags_lead"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE;

ALTER TABLE "lead_tags" ADD CONSTRAINT "FK_lead_tags_tag"
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE;

-- =====================================================
-- 3. CREATE CUSTOMER TAGS TABLE
-- =====================================================

CREATE TABLE "customer_tags" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customerId" uuid NOT NULL,
    "tagId" uuid NOT NULL,
    "addedBy" uuid,
    "notes" text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_customer_tags" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "customer_tags" ADD CONSTRAINT "FK_customer_tags_customer"
    FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "customer_tags" ADD CONSTRAINT "FK_customer_tags_tag"
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE;

ALTER TABLE "customer_tags" ADD CONSTRAINT "FK_customer_tags_added_by"
    FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE SET NULL;

-- =====================================================
-- 4. CREATE CRM ACTIONS TABLE
-- =====================================================

CREATE TABLE "crm_actions" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customerId" uuid NOT NULL,
    "salespersonId" uuid NOT NULL,
    "actionType" action_type_enum NOT NULL,
    "title" character varying NOT NULL,
    "description" text,
    "status" action_status_enum NOT NULL DEFAULT 'pending',
    "priority" action_priority_enum NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "relatedAppointmentId" uuid,
    "relatedLeadId" uuid,
    "metadata" jsonb,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_crm_actions" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "crm_actions" ADD CONSTRAINT "FK_crm_actions_customer"
    FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "crm_actions" ADD CONSTRAINT "FK_crm_actions_salesperson"
    FOREIGN KEY ("salespersonId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX "IDX_crm_actions_customer" ON "crm_actions" ("customerId");
CREATE INDEX "IDX_crm_actions_salesperson" ON "crm_actions" ("salespersonId");
CREATE INDEX "IDX_crm_actions_status" ON "crm_actions" ("status");
CREATE INDEX "IDX_crm_actions_due_date" ON "crm_actions" ("dueDate");

-- =====================================================
-- 5. CREATE COMMUNICATION LOGS TABLE
-- =====================================================

CREATE TABLE "communication_logs" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customerId" uuid NOT NULL,
    "salespersonId" uuid NOT NULL,
    "type" communication_type_enum NOT NULL,
    "direction" communication_direction_enum,
    "status" communication_status_enum NOT NULL DEFAULT 'completed',
    "subject" text NOT NULL,
    "notes" text,
    "durationSeconds" integer,
    "scheduledAt" TIMESTAMPTZ,
    "metadata" jsonb,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_communication_logs" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "communication_logs" ADD CONSTRAINT "FK_communication_logs_customer"
    FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "communication_logs" ADD CONSTRAINT "FK_communication_logs_salesperson"
    FOREIGN KEY ("salespersonId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX "IDX_communication_logs_customer" ON "communication_logs" ("customerId");
CREATE INDEX "IDX_communication_logs_salesperson" ON "communication_logs" ("salespersonId");
CREATE INDEX "IDX_communication_logs_type" ON "communication_logs" ("type");
CREATE INDEX "IDX_communication_logs_created_at" ON "communication_logs" ("createdAt");

-- =====================================================
-- 6. CREATE CUSTOMER RECORDS TABLE
-- =====================================================

CREATE TABLE "customer_records" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "customerId" uuid NOT NULL,
    "assignedSalespersonId" uuid,
    "customerStatus" customer_status_enum NOT NULL DEFAULT 'new',
    "lifetimeValue" decimal(10,2) NOT NULL DEFAULT 0,
    "totalAppointments" integer NOT NULL DEFAULT 0,
    "completedAppointments" integer NOT NULL DEFAULT 0,
    "cancelledAppointments" integer NOT NULL DEFAULT 0,
    "lastAppointmentDate" TIMESTAMPTZ,
    "nextAppointmentDate" TIMESTAMPTZ,
    "lastContactDate" TIMESTAMPTZ,
    "averageDaysBetweenVisits" integer,
    "preferences" jsonb,
    "treatmentHistory" jsonb,
    "preferredClinicId" uuid,
    "preferredDoctorId" uuid,
    "clinicHistory" jsonb,
    "doctorHistory" jsonb,
    "lastClinicId" uuid,
    "lastDoctorId" uuid,
    "treatmentPreferences" jsonb,
    "isRepeatCustomer" boolean NOT NULL DEFAULT false,
    "notes" text,
    "repeatCount" character varying,
    "expectedNextVisit" date,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_customer_records" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "customer_records" ADD CONSTRAINT "FK_customer_records_customer"
    FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "customer_records" ADD CONSTRAINT "FK_customer_records_salesperson"
    FOREIGN KEY ("assignedSalespersonId") REFERENCES "users"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX "IDX_customer_records_customer" ON "customer_records" ("customerId");
CREATE INDEX "IDX_customer_records_salesperson" ON "customer_records" ("assignedSalespersonId");
CREATE INDEX "IDX_customer_records_status" ON "customer_records" ("customerStatus");
CREATE INDEX "IDX_customer_records_repeat" ON "customer_records" ("isRepeatCustomer");

-- =====================================================
-- 7. ENHANCE EXISTING TABLES
-- =====================================================

-- Add new columns to leads table
ALTER TABLE "leads"
ADD COLUMN IF NOT EXISTS "facebookLeadId" varchar,
ADD COLUMN IF NOT EXISTS "facebookFormId" varchar,
ADD COLUMN IF NOT EXISTS "facebookCampaignId" varchar,
ADD COLUMN IF NOT EXISTS "facebookAdSetId" varchar,
ADD COLUMN IF NOT EXISTS "facebookAdId" varchar,
ADD COLUMN IF NOT EXISTS "facebookLeadData" jsonb,
ADD COLUMN IF NOT EXISTS "estimatedValue" decimal(10,2),
ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "metadata" jsonb;

-- Update leads table enum constraint to include 'merged' status
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_status_check";
ALTER TABLE "leads" ADD CONSTRAINT "leads_status_check"
    CHECK ("status" IN ('new', 'contacted', 'qualified', 'appointment_scheduled', 'converted', 'lost', 'follow_up', 'merged'));

-- Add assignedSalespersonId to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assignedSalespersonId" uuid;
ALTER TABLE "users" ADD CONSTRAINT "FK_users_assigned_salesperson"
    FOREIGN KEY ("assignedSalespersonId") REFERENCES "users"("id") ON DELETE SET NULL;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check that all tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'lead_tags',
    'customer_tags',
    'crm_actions',
    'communication_logs',
    'customer_records'
);

-- Check that all enum types were created
SELECT n.nspname AS schema_name,
       t.typname AS type_name,
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE t.typname IN (
    'action_type_enum',
    'action_status_enum',
    'action_priority_enum',
    'communication_type_enum',
    'communication_direction_enum',
    'communication_status_enum',
    'customer_status_enum'
)
GROUP BY n.nspname, t.typname;

-- Check new columns in leads table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
AND column_name IN (
    'facebookLeadId', 'facebookFormId', 'facebookCampaignId',
    'facebookAdSetId', 'facebookAdId', 'facebookLeadData',
    'estimatedValue', 'lastContactedAt', 'convertedAt', 'metadata'
);

-- Check new column in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'assignedSalespersonId';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- If you see this message, migration was successful!
SELECT 'CRM Database Migration Completed Successfully! 🎉' as status;
