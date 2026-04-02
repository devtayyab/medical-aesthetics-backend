const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", "salespersonId", title, status FROM crm_actions WHERE id IN ($1, $2, $3)', ['2098338d-4889-4f7a-bcd1-fe8ad13642b1', 'd2e68ded-3a6f-4fb5-badd-867d7eb73555', 'd9c83ddd-03b1-4c3b-9aac-33ad3d0265f0']);
  console.log('Action Details:', res.rows);
  await client.end();
}
run().catch(console.error);
