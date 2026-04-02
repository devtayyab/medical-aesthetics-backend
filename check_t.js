const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId", "relatedLeadId", title FROM tasks ORDER BY "createdAt" DESC LIMIT 5');
  console.log('Tasks found:', res.rows);
  await client.end();
}
run().catch(console.error);
