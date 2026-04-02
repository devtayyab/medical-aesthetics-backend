const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "customerId" FROM customer_records WHERE id IN ($1, $2)', ['a6b603c2-b864-4fe4-b066-9b031d238af8', '2098338d-4889-4f7a-bcd1-fe8ad13642b1']);
  console.log('CustomerRecord Details:', res.rows);
  await client.end();
}
run().catch(console.error);
