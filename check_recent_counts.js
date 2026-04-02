const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT count(*) FROM crm_actions WHERE "createdAt" > $1', ['2026-03-31']);
  console.log('CRM Actions since yesterday:', res.rows[0]);
  const res2 = await client.query('SELECT count(*) FROM tasks WHERE "createdAt" > $1', ['2026-03-31']);
  console.log('Tasks since yesterday:', res2.rows[0]);
  
  if (parseInt(res2.rows[0].count) > 0) {
    const res3 = await client.query('SELECT id, title, "createdAt" FROM tasks WHERE "createdAt" > $1 ORDER BY "createdAt" DESC LIMIT 5', ['2026-03-31']);
    console.log('Last recent tasks:', res3.rows);
  }

  await client.end();
}
run().catch(console.error);
