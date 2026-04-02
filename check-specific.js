const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics'
  });

  const ids = ['2eb4dfa5-c3e2-4219-86cb-1a641b156551', '5dcd1972-1b50-4258-baea-1a3fc32b2c73'];

  try {
    await client.connect();
    console.log("Connected to DB!");

    for (const id of ids) {
      const res = await client.query(`SELECT id, "deletedAt" FROM customer_records WHERE id = $1;`, [id]);
      console.log(`Checking customer_records(id) = ${id}: Found ${res.rowCount}`);
      if (res.rowCount > 0) console.log(res.rows[0]);
    }

    const leadId = '5dcd1972-1b50-4258-baea-1a3fc32b2c73';
    const resLead = await client.query(`SELECT id, "deletedAt" FROM leads WHERE id = $1;`, [leadId]);
    console.log(`Checking leads(id) = ${leadId}: Found ${resLead.rowCount}`);
    if (resLead.rowCount > 0) console.log(resLead.rows[0]);

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
