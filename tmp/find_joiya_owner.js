const { Client } = require('pg');

async function findOwner() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
    const query = `
      SELECT u.email, u."passwordHash", u.role, c.name as clinic_name
      FROM users u
      JOIN clinics c ON u.id = c."ownerId"
      WHERE c.name ILIKE '%Joiya%';
    `;
    const res = await client.query(query);
    console.log('--- JOIYA CLINIC OWNER ---');
    if (res.rows.length === 0) {
      console.log('No owner found for Joiya Clinic.');
    } else {
      res.rows.forEach(r => {
        console.log(`Clinic: ${r.clinic_name}`);
        console.log(`Email: ${r.email}`);
        console.log(`Hashed Password: ${r.passwordHash}`);
        console.log(`Role: ${r.role}`);
        console.log('-------------------------');
      });
    }

    // Also check for users by email just in case Joiya is in the email
    console.log('\n--- USERS WITH JOIYA IN EMAIL ---');
    const joiyaUsers = await client.query("SELECT email, role FROM users WHERE email ILIKE '%joiya%'");
    joiyaUsers.rows.forEach(r => {
      console.log(`Email: ${r.email} | Role: ${r.role}`);
    });

  } finally {
    await client.end();
  }
}

findOwner().catch(console.error);
