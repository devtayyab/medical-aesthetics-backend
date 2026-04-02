const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkEnum() {
  await client.connect();
  const res = await client.query("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'treatment_categories_status_enum'");
  console.log('Values:', res.rows.map(r => r.enumlabel));
  await client.end();
}

checkEnum();
