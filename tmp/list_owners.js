const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
    const clinics = await client.query('SELECT name, "ownerId" FROM clinics;');
    console.log('--- ALL CLINICS ---');
    clinics.rows.forEach(r => {
      console.log(`Clinic: ${r.name} | OwnerId: ${r.ownerId}`);
    });

    const owners = await client.query('SELECT id, email, role FROM users WHERE role = \'clinic_owner\'');
    console.log('\n--- ALL CLINIC OWNERS ---');
    owners.rows.forEach(r => {
      console.log(`ID: ${r.id} | Email: ${r.email} | Role: ${r.role}`);
    });

  } finally {
    await client.end();
  }
}

check().catch(console.error);
