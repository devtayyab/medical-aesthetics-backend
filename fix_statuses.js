const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function updateStatuses() {
  await client.connect();
  try {
    console.log('Updating appointment statuses to uppercase...');
    await client.query("UPDATE appointments SET status = UPPER(status)");
    console.log('Statuses updated successfully.');
  } catch (err) {
    console.error('Error updating statuses:', err.message);
  } finally {
    await client.end();
  }
}

updateStatuses();
