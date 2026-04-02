const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
});

async function check() {
  await dataSource.initialize();
  const res = await dataSource.query(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'status'
  `);
  console.log('Status column details:', res);
  
  const enumValues = await dataSource.query(`
    SELECT e.enumlabel 
    FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'appointments_status_enum'
  `);
  console.log('Enum values:', enumValues);
  
  await dataSource.destroy();
}

check().catch(console.error);
