import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

async function checkEnum() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: true,
  });

  try {
    const results = await connection.query(`
      SELECT n.nspname as enum_schema,
             t.typname as enum_name,
             e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'treatments_status_enum';
    `);
    console.log('Enum values in DB:', results);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.close();
  }
}

checkEnum();
