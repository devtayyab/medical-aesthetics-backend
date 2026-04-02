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

    const resAct = await client.query(`SELECT count(*) FROM crm_actions;`);
    console.log(`Total CRM Actions: ${resAct.rows[0].count}`);

    const resLead = await client.query(`SELECT count(*) FROM leads;`);
    console.log(`Total Leads: ${resLead.rows[0].count}`);

    const resCust = await client.query(`SELECT count(*) FROM customer_records;`);
    console.log(`Total Customers: ${resCust.rows[0].count}`);

    const resUser = await client.query(`SELECT count(*) FROM users;`);
    console.log(`Total Users: ${resUser.rows[0].count}`);

    const latestUsers = await client.query(`SELECT id, email, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 3;`);
    console.log("Latest Users:", latestUsers.rows);

  } catch (err) {
    console.error("Query error:", err.message);
  } finally {
    await client.end();
  }
}

test();
