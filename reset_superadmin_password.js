const { Client } = require('pg');
const bcrypt = require('bcrypt');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function resetPassword() {
  try {
    await client.connect();
    const newPassword = 'SuperAdmin123!';
    const saltRounds = 12;
    const hash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = "UPDATE users SET \"passwordHash\" = $1 WHERE email = 'superadmin@example.com'";
    const res = await client.query(query, [hash]);
    
    if (res.rowCount > 0) {
      console.log('SUCCESS: Password for superadmin@example.com reset to SuperAdmin123!');
      
      // Verify immediately
      const checkRes = await client.query("SELECT \"passwordHash\" FROM users WHERE email = 'superadmin@example.com'");
      const isMatch = await bcrypt.compare(newPassword, checkRes.rows[0].passwordHash);
      console.log('Verification match:', isMatch);
    } else {
      console.log('ERROR: superadmin@example.com user not found!');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

resetPassword();
