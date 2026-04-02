const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics'
  });

  try {
    await client.connect();
    console.log("Connected to DB!");

    const res = await client.query(`SELECT id, name, "businessHours" FROM clinics;`);
    for (const row of res.rows) {
      console.log(`Clinic: ${row.name}`);
      console.log(JSON.stringify(row.businessHours, null, 2));
    }

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
