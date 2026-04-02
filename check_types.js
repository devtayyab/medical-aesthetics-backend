const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkTypes() {
  await client.connect();
  const res = await client.query("SELECT n.nspname as schema, t.typname as type FROM pg_type t LEFT JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e'");
  console.log('Enums:', res.rows.map(r => r.type));
  await client.end();
}

checkTypes();
