const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function main() {
  await client.connect();
  const res = await client.query('SELECT id, name, "isActive" FROM clinics');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(console.error);
