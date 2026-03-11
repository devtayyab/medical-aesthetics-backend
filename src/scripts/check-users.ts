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
  const users = await ds.query(`SELECT id, email, role, "isActive" FROM users`);
  console.log('Users:', users);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
