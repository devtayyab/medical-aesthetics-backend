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
    const crId = '5034324a-8174-4b1c-9b64-5203a47b9a92';
    
    // Try as customer_records.id
    const cr = await client.query(`SELECT id, "customerId" FROM customer_records WHERE id = $1`, [crId]);
    console.log("As customer_record ID:", cr.rows);

    // Try as customer_records.customerId
    const cr2 = await client.query(`SELECT id, "customerId" FROM customer_records WHERE "customerId" = $1`, [crId]);
    console.log("As customerId:", cr2.rows);

    // What is this ID in general?
    const tables = ['users', 'leads'];
    for (const t of tables) {
      const r = await client.query(`SELECT id FROM ${t} WHERE id = $1`, [crId]);
      console.log(`In ${t}:`, r.rows);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

test();
