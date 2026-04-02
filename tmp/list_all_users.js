const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics'
  });
  await client.connect();

  try {
    const users = await client.query('SELECT email, role, "firstName", "lastName" FROM users;');
    console.log('--- ALL USERS ---');
    users.rows.forEach(r => {
      console.log(`Email: ${r.email} | Role: ${r.role} | Name: ${r.firstName} ${r.lastName}`);
    });

  } finally {
    await client.end();
  }
}

check().catch(console.error);
