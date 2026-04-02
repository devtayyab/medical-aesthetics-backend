const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics'
  });

  const ids = ['b0a72fb5-6b48-4c59-9579-80f0ffa720c9'];

  try {
    await client.connect();
    console.log("Connected to DB!");

    for (const id of ids) {
      const res = await client.query(`SELECT id FROM customer_records WHERE id = $1;`, [id]);
      console.log(`Checking customer_records(id) = ${id}: Found ${res.rowCount}`);
      
      const resUser = await client.query(`SELECT id FROM users WHERE id = $1;`, [id]);
      console.log(`Checking users(id) = ${id}: Found ${resUser.rowCount}`);

      const resLead = await client.query(`SELECT id FROM leads WHERE id = $1;`, [id]);
      console.log(`Checking leads(id) = ${id}: Found ${resLead.rowCount}`);
    }

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
