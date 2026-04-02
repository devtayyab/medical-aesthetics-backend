const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function reset() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
    const password = 'Clinic123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    const email = 'ehsan@example.com';
    const result = await client.query('UPDATE users SET "passwordHash" = $1 WHERE email = $2 RETURNING id;', [hashedPassword, email]);

    if (result.rows.length > 0) {
      console.log(`Password reset for ${email} successfully!`);
      console.log(`New Password: ${password}`);
    } else {
      console.log(`User ${email} not found.`);
    }

  } finally {
    await client.end();
  }
}

reset().catch(console.error);
