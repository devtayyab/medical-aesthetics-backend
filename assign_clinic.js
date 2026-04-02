const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function assignClinic() {
  await client.connect();
  try {
    const res = await client.query('INSERT INTO clinic_ownership ("clinicId", "ownerUserId", "visibilityScope") VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
      '1f0c099e-663f-462a-bd8d-b90ad71cbb01', 
      'cf1c6100-c43a-4e0c-8eb4-c493d7bf28b5', 
      'private'
    ]);
    console.log('Assignment successful');
  } catch (err) {
    console.error('Failure:', err.message);
  } finally {
    await client.end();
  }
}

assignClinic();
