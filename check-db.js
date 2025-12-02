const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DATABASE_USERNAME || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'medical_aesthetics',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  port: process.env.DATABASE_PORT || 5432,
});

async function checkDatabase() {
  const client = await pool.connect();
  try {
    // List all tables
    console.log('\n=== Database Tables ===');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\nList of tables:');
    console.table(tablesRes.rows.map(t => ({ 'Table Name': t.table_name })));

    // Get details for each table
    console.log('\n=== Table Details ===');
    for (const table of tablesRes.rows) {
      const tableName = table.table_name;
      const columnsRes = await client.query({
        text: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `,
        values: [tableName]
      });
      
      console.log(`\nTable: ${tableName}`);
      console.table(columnsRes.rows.map(c => ({
        'Column': c.column_name,
        'Type': c.data_type,
        'Nullable': c.is_nullable,
        'Default': c.column_default
      })));
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase().catch(console.error);
