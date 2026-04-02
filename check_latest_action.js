const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", "salespersonId", title, "createdAt" FROM crm_actions ORDER BY "createdAt" DESC LIMIT 1');
  console.log('Latest Action Record:', res.rows[0]);
  await client.end();
}
run().catch(console.error);
