const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkAptSchema() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'status'");
  console.log('Status Column:', res.rows[0]);
  await client.end();
}

checkAptSchema();
