import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connection = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
  });

  const appointments = await connection.query('SELECT status, COUNT(*) as count FROM appointments GROUP BY status');
  console.log('APPOINTMENT STATUSES IN DB:');
  console.log(JSON.stringify(appointments, null, 2));
  
  await connection.close();
}

check().catch(console.error);
