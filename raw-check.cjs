
const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    const tableCheck = await client.query("SELECT * FROM information_schema.tables WHERE table_name = 'notification_templates'");
    if (tableCheck.rows.length === 0) {
      console.log('Table notification_templates DOES NOT EXIST');
    } else {
      console.log('Table notification_templates EXISTS');
      const enumCheck = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'notification_templates_type_enum'");
      console.log('ENUM labels:', enumCheck.rows.map(r => r.enumlabel));
      
      const data = await client.query("SELECT * FROM notification_templates");
      console.log('Data count:', data.rows.length);
    }
    
    await client.end();
  } catch (error) {
    console.error('Raw PG Error:', error);
  }
}

test();
