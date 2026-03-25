-- Migration: Add missing appointment columns
-- Run this against your medical_aesthetics database

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "cancelledById" UUID,
  ADD COLUMN IF NOT EXISTS "noShowMarkedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "noShowMarkedById" UUID,
  ADD COLUMN IF NOT EXISTS "showStatus" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "serviceExecuted" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "followUpServiceId" VARCHAR,
  ADD COLUMN IF NOT EXISTS "clinicNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "bookedById" UUID,
  ADD COLUMN IF NOT EXISTS "appointmentCompletionReport" JSON,
  ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "appointmentSource" VARCHAR(50) NOT NULL DEFAULT 'platform_broker';

-- Add foreign key constraints (safe to run even if they already exist via IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_appointments_cancelledById'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT "FK_appointments_cancelledById"
      FOREIGN KEY ("cancelledById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_appointments_noShowMarkedById'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT "FK_appointments_noShowMarkedById"
      FOREIGN KEY ("noShowMarkedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_appointments_bookedById'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT "FK_appointments_bookedById"
      FOREIGN KEY ("bookedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
