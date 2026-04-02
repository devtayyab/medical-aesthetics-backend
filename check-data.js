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

    const res = await client.query(`SELECT id, "customerId" FROM customer_records LIMIT 5;`);
    console.log("Customer Records in DB:");
    res.rows.forEach(r => console.log(r));

    const actions = await client.query(`SELECT "customerId", "relatedLeadId" FROM crm_actions LIMIT 5;`);
    console.log("CRM Actions in DB:");
    actions.rows.forEach(r => console.log(r));

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
