-- Run this on the SERVER database to create missing tables
-- Connect with: docker exec -it <postgres-container> psql -U postgres -d medical_aesthetics

-- 1. lead_owners (ManyToMany junction: leads <-> users)
CREATE TABLE IF NOT EXISTS "lead_owners" (
  "leadId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  CONSTRAINT "PK_lead_owners" PRIMARY KEY ("leadId", "userId"),
  CONSTRAINT "FK_lead_owners_lead" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "FK_lead_owners_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IDX_lead_owners_leadId" ON "lead_owners" ("leadId");
CREATE INDEX IF NOT EXISTS "IDX_lead_owners_userId" ON "lead_owners" ("userId");

-- 2. lead_clinics (ManyToMany junction: leads <-> clinics)
CREATE TABLE IF NOT EXISTS "lead_clinics" (
  "leadId" uuid NOT NULL,
  "clinicId" uuid NOT NULL,
  CONSTRAINT "PK_lead_clinics" PRIMARY KEY ("leadId", "clinicId"),
  CONSTRAINT "FK_lead_clinics_lead" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "FK_lead_clinics_clinic" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IDX_lead_clinics_leadId" ON "lead_clinics" ("leadId");
CREATE INDEX IF NOT EXISTS "IDX_lead_clinics_clinicId" ON "lead_clinics" ("clinicId");

-- 3. lead_clinic_statuses
CREATE TYPE IF NOT EXISTS "lead_status_enum" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');

CREATE TABLE IF NOT EXISTS "lead_clinic_statuses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "leadId" uuid NOT NULL,
  "clinicId" uuid NOT NULL,
  "status" "lead_status_enum" NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_lead_clinic_statuses" PRIMARY KEY ("id"),
  CONSTRAINT "FK_lcs_lead" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "FK_lcs_clinic" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "IDX_lcs_leadId" ON "lead_clinic_statuses" ("leadId");

-- Done!
SELECT 'Migration complete' AS result;
