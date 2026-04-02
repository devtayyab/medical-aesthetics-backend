const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkTreatments() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'treatments'");
  console.log('Columns:', res.rows);
  await client.end();
}

checkTreatments();
