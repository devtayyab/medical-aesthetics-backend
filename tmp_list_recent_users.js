const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, email, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 10');
    console.log('Recent Users:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
