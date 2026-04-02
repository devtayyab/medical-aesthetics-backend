const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function checkSuperAdmin() {
  try {
    await client.connect();
    const query = "SELECT id, \"firstName\", \"lastName\", email, role, \"isActive\", \"passwordHash\" FROM users WHERE email = 'superadmin@example.com'";
    const res = await client.query(query);
    
    if (res.rows.length === 0) {
      console.log('ISSUE: superadmin@example.com NOT FOUND IN DATABASE!');
      const rolesRes = await client.query("SELECT DISTINCT role FROM users");
      console.log('Existing roles in DB:', rolesRes.rows.map(r => r.role));
      
      const adminRes = await client.query("SELECT email, role FROM users WHERE role = 'SUPER_ADMIN' OR role = 'ADMIN' LIMIT 5");
      console.log('Other admin-like users:', adminRes.rows);
    } else {
      const user = res.rows[0];
      console.log('Super Admin User Data:', JSON.stringify(user, null, 2));
      if (!user.isActive) {
        console.log('ISSUE: User is NOT active!');
      }
      if (user.role !== 'SUPER_ADMIN') {
        console.log(`ISSUE: User role is '${user.role}' instead of 'SUPER_ADMIN'!`);
      }
    }
    
    await client.end();
  } catch (err) {
    console.error('Error connecting to DB:', err);
    process.exit(1);
  }
}

checkSuperAdmin();
