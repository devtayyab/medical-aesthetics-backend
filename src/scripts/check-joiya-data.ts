import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  const joiya = await client.query("SELECT id, name FROM clinics WHERE name ILIKE '%Joiya%'");
  if (joiya.rows.length === 0) {
      console.log('Joiya Clinic not found');
      await client.end();
      return;
  }

  const clinicId = joiya.rows[0].id;
  console.log(`Clinic Found: ${joiya.rows[0].name} (ID: ${clinicId})`);

  console.log('\n--- All Services for this Clinic ---');
  const allServices = await client.query('SELECT id, "treatmentId", "isActive" FROM services WHERE "clinicId" = $1', [clinicId]);
  console.table(allServices.rows);

  console.log('\n--- Treatment Link Check ---');
  const serviceDetails = await client.query(`
      SELECT s.id as service_id, s."isActive" as service_active, t.name as treatment_name, t."isActive" as treatment_active, t.status 
      FROM services s 
      LEFT JOIN treatments t ON s."treatmentId" = t.id 
      WHERE s."clinicId" = $1
  `, [clinicId]);
  console.table(serviceDetails.rows);

  await client.end();
}

checkData().catch(console.error);
