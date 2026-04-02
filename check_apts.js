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

    const res = await client.query(`SELECT id, "clinicId", "providerId", "startTime", "endTime", status FROM appointments WHERE status = 'CONFIRMED' LIMIT 10;`);
    console.log("Confirmed Appointments:", res.rows);

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
