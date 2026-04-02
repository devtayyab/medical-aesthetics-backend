const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkUser() {
  try {
    await client.connect();
    const res = await client.query("SELECT id, \"firstName\", \"lastName\", email, role, \"assignedClinicId\" FROM users WHERE email = 'ehsan@example.com'");
    console.log('User:', res.rows[0]);
    if (res.rows[0]) {
      const clinics = await client.query("SELECT id, name, \"ownerId\" FROM clinics WHERE \"ownerId\" = $1", [res.rows[0].id]);
      console.log('Owned Clinics:', clinics.rows);
      
      const allClinics = await client.query("SELECT id, name, \"ownerId\" FROM clinics");
      console.log('All Clinics:', allClinics.rows);
    }
    await client.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
