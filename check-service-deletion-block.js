const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/medical_aesthetics"
  });
  await client.connect();
  
  const serviceId = '7cc7ae88-5936-40f4-a8ae-4f7f5255018a'; // truncated from screenshot 7cc7ae88...
  
  // Search for service with prefix
  const serviceRes = await client.query('SELECT s.id, t.name FROM services s JOIN treatments t ON s."treatmentId" = t.id WHERE s.id::text LIKE $1', ['7cc7ae88%']);
  console.log('Services matching:', serviceRes.rows);
  
  if (serviceRes.rows.length > 0) {
    const realId = serviceRes.rows[0].id;
    const aptRes = await client.query('SELECT id, status, "startTime" FROM appointments WHERE "serviceId" = $1', [realId]);
    console.log('Appointments for this service:', aptRes.rows);
  }
  
  await client.end();
}

check();
