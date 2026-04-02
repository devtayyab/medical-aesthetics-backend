const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function run() {
  try {
    await client.connect();
    const tables = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != \'pg_catalog\' AND schemaname != \'information_schema\'');
    console.log('Tables:', tables.rows.map(r => r.tablename));
    const userRes = await client.query("SELECT id, email FROM users WHERE id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230'");
    console.log('User found:', userRes.rows);
    const leadRes = await client.query("SELECT id, email FROM leads WHERE id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230'");
    console.log('Lead found:', leadRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
