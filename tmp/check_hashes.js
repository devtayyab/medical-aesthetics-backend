const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
    const users = await client.query('SELECT email, "passwordHash", role FROM users;');
    console.log('--- PASSWORD HASHES ---');
    users.rows.forEach(r => {
      console.log(`Email: ${r.email} | Hash: ${r.passwordHash}`);
    });

  } finally {
    await client.end();
  }
}

check().catch(console.error);
