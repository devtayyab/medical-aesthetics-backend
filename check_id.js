const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const c = await client.query('SELECT id, firstName, email FROM users WHERE id=$1', ['2098338d-4889-4f7a-bcd1-fe8ad13642b1']);
  const l = await client.query('SELECT id, firstName, email FROM leads WHERE id=$1', ['2098338d-4889-4f7a-bcd1-fe8ad13642b1']);
  console.log('User:', c.rows);
  console.log('Lead:', l.rows);
  await client.end();
}
run().catch(console.error);
