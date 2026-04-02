const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", "actionType", title, status FROM crm_actions ORDER BY "createdAt" DESC LIMIT 5');
  console.log('Recent Actions:', res.rows);
  await client.end();
}
run().catch(console.error);
