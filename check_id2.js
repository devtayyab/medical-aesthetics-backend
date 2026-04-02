const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const cr = await client.query('SELECT id, "customerId", "lifetimeValue" FROM customer_records WHERE id=\'2098338d-4889-4f7a-bcd1-fe8ad13642b1\' OR "customerId"=\'2098338d-4889-4f7a-bcd1-fe8ad13642b1\'');
  console.log('Customer Record:', cr.rows);
  await client.end();
}
run().catch(console.error);
