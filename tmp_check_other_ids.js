const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
async function run() {
  try {
    await client.connect();
    const serviceRes = await client.query("SELECT id FROM services WHERE id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230'");
    console.log('Service found:', serviceRes.rows);
    const clinicRes = await client.query("SELECT id FROM clinics WHERE id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230'");
    console.log('Clinic found:', clinicRes.rows);
    const treatmentRes = await client.query("SELECT id FROM treatments WHERE id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230'");
    console.log('Treatment found:', treatmentRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
