const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
async function run() {
  try {
    await client.connect();
    const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Databases:', dbs.rows.map(r => r.datname));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
