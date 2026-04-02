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
  const res = await dataSource.query(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'appointments_status_enum'`);
  console.log('appointments_status_enum labels:');
  res.forEach(r => console.log(r.enumlabel));
  await dataSource.destroy();
}

check().catch(console.error);
