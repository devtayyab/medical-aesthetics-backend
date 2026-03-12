import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  console.log('--- Clinics ---');
  const clinics = await client.query('SELECT id, name FROM clinics LIMIT 5');
  console.table(clinics.rows);

  console.log('--- Treatment Categories ---');
  const cats = await client.query('SELECT id, name, status FROM treatment_categories');
  console.table(cats.rows);

  console.log('--- Treatments (Master) ---');
  const treatments = await client.query('SELECT id, name, "categoryId", status, "isActive" FROM treatments LIMIT 10');
  console.table(treatments.rows);

  console.log('--- Services (Clinic Offerings) ---');
  const services = await client.query('SELECT id, "clinicId", "treatmentId", price, "isActive" FROM services LIMIT 10');
  console.table(services.rows);

  // Check if Joiya Clinic exists and has services
  const joiya = await client.query("SELECT id FROM clinics WHERE name ILIKE '%Joiya%'");
  if (joiya.rows.length > 0) {
      const clinicId = joiya.rows[0].id;
      console.log(`\nChecking Services for Clinic ID: ${clinicId} (Joiya)`);
      const clinicServices = await client.query('SELECT s.id, t.name as treatment_name, s."isActive", t."isActive" as treatment_active, t.status FROM services s JOIN treatments t ON s."treatmentId" = t.id WHERE s."clinicId" = $1', [clinicId]);
      console.table(clinicServices.rows);
  }

  await client.end();
}

checkData().catch(console.error);
