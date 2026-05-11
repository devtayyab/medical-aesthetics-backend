import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connection = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
  });

  const columns = await connection.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'services'
  `);
  console.log('COLUMNS IN services TABLE:');
  console.log(JSON.stringify(columns, null, 2));
  
  await connection.close();
}

check().catch(console.error);
