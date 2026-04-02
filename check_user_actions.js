const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", title, status FROM crm_actions WHERE "salespersonId" = $1 ORDER BY "createdAt" DESC LIMIT 10', ['65a3d976-8398-46fd-a26e-25b71368f790']);
  console.log('Actions for 65a3...salesperson:', res.rows);
  await client.end();
}
run().catch(console.error);
