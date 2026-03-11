import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'medical_aesthetics'
});
ds.initialize().then(async () => {
  const agentIds = await ds.query('SELECT "assignedSalespersonId", count(*) FROM customer_records GROUP BY "assignedSalespersonId";');
  console.log('Customer Recs assigned:', agentIds);

  const testApt = await ds.query('SELECT count(*) FROM appointments apt INNER JOIN customer_records rec ON rec."customerId" = apt."clientId";');
  console.log('Appointments linked to customer_records:', testApt);

  process.exit(0);
}).catch(console.error);
