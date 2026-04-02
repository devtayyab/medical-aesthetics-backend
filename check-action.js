const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics'
  });

  const ids = ['243dcbb2-b2e9-4d44-9882-ecdc9088e63d'];

  try {
    await client.connect();
    console.log("Connected to DB!");

    for (const id of ids) {
      const res = await client.query(`SELECT * FROM crm_actions WHERE id = $1;`, [id]);
      console.log(`Checking crm_actions(id) = ${id}: Found ${res.rowCount}`);
      if (res.rowCount > 0) console.log(res.rows[0]);
    }

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
