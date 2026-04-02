const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics'
  });

  const ids = ['7f93e8ef-5251-4ab6-a797-7910c86bfae3', '4d4fb5ba-e552-4324-9afa-78817550fde8'];

  try {
    await client.connect();
    console.log("Connected to DB!");

    for (const id of ids) {
      const res = await client.query(`SELECT id FROM customer_records WHERE id = $1;`, [id]);
      console.log(`Checking customer_records(id) = ${id}: Found ${res.rowCount}`);
      const resUser = await client.query(`SELECT id FROM users WHERE id = $1;`, [id]);
      console.log(`Checking users(id) = ${id}: Found ${resUser.rowCount}`);
    }

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
