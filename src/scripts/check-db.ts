import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';
import { DatabaseConfig } from '../config/database.config';

async function checkDatabase() {
  const connection = await createConnection({
    ...new DatabaseConfig().createTypeOrmOptions(),
    logging: true,
  });

  try {
    console.log('\n=== Database Tables ===');
    const tables = await connection.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name;`
    );
    
    console.log('\nList of tables:');
    console.table(tables.map(t => ({ 'Table Name': t.table_name })));

    console.log('\n=== Table Details ===');
    for (const table of tables) {
      const tableName = table.table_name;
      const columns = await connection.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\nTable: ${tableName}`);
      console.table(columns.map(c => ({
        'Column': c.column_name,
        'Type': c.data_type,
        'Nullable': c.is_nullable,
        'Default': c.column_default
      })));
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await connection.close();
  }
}

checkDatabase().catch(console.error);
