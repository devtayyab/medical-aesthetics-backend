const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
    const clinics = await client.query('SELECT name, "isActive", city FROM (SELECT name, "isActive", address->>\'city\' as city FROM clinics) AS sub;');
    console.log('--- CLINICS STATUS ---');
    clinics.rows.forEach(r => {
      console.log(`Clinic: ${r.name} | Active: ${r.isActive} | City: ${r.city}`);
    });

    const treatments = await client.query('SELECT name, "isActive", status FROM treatments');
    console.log('--- TREATMENTS STATUS ---');
    treatments.rows.forEach(r => {
      console.log(`Treatment: ${r.name} | Active: ${r.isActive} | Status: ${r.status}`);
    });

    const services = await client.query('SELECT s.id, c.name as clinic_name, t.name as treatment_name, s."isActive" as service_active, c."isActive" as clinic_active FROM services s JOIN clinics c ON s."clinicId" = c.id JOIN treatments t ON s."treatmentId" = t.id');
    console.log('--- LINKED SERVICES ---');
    services.rows.forEach(r => {
      console.log(`Service: ${r.treatment_name} @ ${r.clinic_name} | Service Active: ${r.service_active} | Clinic Active: ${r.clinic_active}`);
    });

  } finally {
    await client.end();
  }
}

check().catch(console.error);
