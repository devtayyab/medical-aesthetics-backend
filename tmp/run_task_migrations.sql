-- Run this on the SERVER database to add missing columns to tasks table
-- Connect with: docker exec -it <postgres-container> psql -U postgres -d medical_aesthetics

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "isRecurring" boolean NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurringIntervalDays" integer;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurringUntil" timestamp with time zone;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "completedAt" timestamp with time zone;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "customerRecordId" uuid;

-- Done!
SELECT 'Task columns migration complete' AS result;
