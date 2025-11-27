const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DATABASE_USERNAME || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'medical_aesthetics',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  port: process.env.DATABASE_PORT || 5432,
});

async function checkTables() {
  const client = await pool.connect();
  try {
    // Check if tables exist
    const tables = ['ad_attributions', 'ad_campaigns', 'customer_records'];
    
    for (const table of tables) {
      const exists = await client.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name = $1
        )`, [table]
      );
      
      console.log(`\n=== Table: ${table} ===`);
      console.log(`Exists: ${exists.rows[0].exists}`);
      
      if (exists.rows[0].exists) {
        // Get table structure
        const columns = await client.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        
        console.log('\nColumns:');
        console.table(columns.rows);
      }
    }
    
    // Check for foreign keys
    console.log('\n=== Foreign Key Relationships ===');
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' AND
        (tc.table_name = 'ad_attributions' OR 
         tc.table_name = 'ad_campaigns' OR
         tc.table_name = 'customer_records' OR
         ccu.table_name IN ('ad_attributions', 'ad_campaigns', 'customer_records'))
    `;
    
    const fkResult = await client.query(fkQuery);
    console.log('\nForeign Keys:');
    console.table(fkResult.rows);
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables().catch(console.error);
