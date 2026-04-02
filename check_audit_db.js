const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'medical_aesthetics',
  synchronize: false,
});

async function check() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  const table = await queryRunner.getTable('audit_logs');
  if (!table) {
      console.log('TABLE NOT FOUND');
  } else {
    console.log('Columns in audit_logs:');
    table.columns.forEach(c => console.log(c.name, c.type));
  }
  await dataSource.destroy();
}

check().catch(console.error);
