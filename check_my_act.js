const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", title FROM crm_actions WHERE "customerId"=\'d47ebcac-b8d0-4e07-9d73-586f9b03fba8\' OR "relatedLeadId"=\'d47ebcac-b8d0-4e07-9d73-586f9b03fba8\'');
  console.log('Actions found:', res.rows);
  await client.end();
}
run().catch(console.error);
