const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "firstName", "lastName", role FROM users WHERE id IN ($1, $2)', ['9eba50ad-ee80-4424-94b4-532bfdd265bb', 'ba589ff1-ddbc-4fef-9db0-987c52dd0e21']);
  console.log('Real User Details:', res.rows);
  await client.end();
}
run().catch(console.error);
