const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics'
  });

  try {
    await client.connect();
    console.log("Connected to DB!");

    const clinics = await client.query(`SELECT id, name FROM clinics LIMIT 5;`);
    console.log("Clinics:", clinics.rows);

    for (const clinic of clinics.rows) {
      const providers = await client.query(`
        SELECT u.id, u."firstName", u."lastName", u.role 
        FROM users u 
        WHERE u."assignedClinicId" = $1 AND (u.role = 'doctor' OR u.role = 'clinic_owner');
      `, [clinic.id]);
      console.log(`Clinic ${clinic.name} (${clinic.id}) has ${providers.rowCount} providers:`, providers.rows);

      const services = await client.query(`
        SELECT s.id, t.name as treatment_name 
        FROM services s 
        LEFT JOIN treatments t ON s."treatmentId" = t.id 
        WHERE s."clinicId" = $1;
      `, [clinic.id]);
      console.log(`Clinic ${clinic.name} has ${services.rowCount} services:`, services.rows);
    }

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
