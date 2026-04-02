const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT id FROM customer_records WHERE id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230'");
    console.log('CustomerRecord found:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
