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

    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'crm_actions'::regclass AND contype = 'f';
    `);
    
    console.log("Foreign Keys on crm_actions:");
    res.rows.forEach(r => console.log(r.conname, ':', r.pg_get_constraintdef));

  } catch (err) {
    console.error("Connection failed or query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
