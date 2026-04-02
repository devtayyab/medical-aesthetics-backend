const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function fixDb() {
  await client.connect();
  try {
    console.log('Adding clinical execution fields to appointments table...');
    await client.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "executedAt" TIMESTAMP WITH TIME ZONE`);
    await client.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "executedById" uuid`);
    await client.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "isBeautyDoctorsClient" boolean NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "representativeId" uuid`);
    await client.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "rewardPointsRedeemed" numeric(10,2) NOT NULL DEFAULT '0'`);
    
    console.log('Creating clinic_ownership table...');
    await client.query(`CREATE TABLE IF NOT EXISTS "clinic_ownership" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
      "clinicId" uuid NOT NULL, 
      "ownerUserId" uuid NOT NULL, 
      "visibilityScope" varchar(20) NOT NULL DEFAULT 'private', 
      CONSTRAINT "PK_clinic_ownership" PRIMARY KEY ("id")
    )`);
    
    console.log('Database updated successfully.');
  } catch (err) {
    console.error('Error updating database:', err.message);
  } finally {
    await client.end();
  }
}

fixDb();
