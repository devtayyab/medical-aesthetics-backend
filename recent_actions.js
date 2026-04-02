const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", title, status, "createdAt" FROM crm_actions ORDER BY "createdAt" DESC LIMIT 10');
  console.log('Recent Actions:');
  console.dir(res.rows, { depth: null });
  await client.end();
}
run().catch(console.error);
