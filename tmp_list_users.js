const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function run() {
  try {
    await client.connect();
    const userRes = await client.query('SELECT id, email, role, "firstName" FROM users');
    console.log('Registered Users:', userRes.rows);
    const leadRes = await client.query('SELECT id, email, "firstName", "lastName" FROM leads');
    console.log('Registered Leads:', leadRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
