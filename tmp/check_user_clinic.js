const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function main() {
  await client.connect();
  const res = await client.query('SELECT id, email, role, \"assignedClinicId\" FROM users WHERE email = \'ahsankaemail28@gmail.com\'');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(console.error);
