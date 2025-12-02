const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

async function checkMigrationTable() {
  const pool = new Pool({
    user: process.env.DATABASE_USERNAME || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    database: process.env.DATABASE_NAME || 'medical_aesthetics',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    port: process.env.DATABASE_PORT || 5432,
  });

  try {
    await pool.query('CREATE TABLE IF NOT EXISTS "migrations" (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, timestamp BIGINT NOT NULL);');
    return true;
  } catch (error) {
    console.error('Error checking migration table:', error);
    return false;
  } finally {
    await pool.end();
  }
}

async function runMigrations() {
  try {
    console.log('🔄 Checking migration table...');
    const ready = await checkMigrationTable();
    if (!ready) {
      throw new Error('Failed to prepare migration table');
    }

    console.log('🚀 Running migrations...');
    execSync('npx typeorm-ts-node-commonjs migration:run -d src/config/database.config.ts', {
      stdio: 'inherit',
    });

    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
