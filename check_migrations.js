const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkMigrations() {
  await client.connect();
  const res = await client.query("SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5");
  console.log('Run Migrations:', res.rows);
  await client.end();
}

checkMigrations();
