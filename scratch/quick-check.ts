import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function check() {
  console.log('Connecting to:', process.env.DATABASE_NAME);
  try {
      const connection = await createConnection({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        synchronize: false,
        logging: true,
      });

      const res = await connection.query(`
        SELECT s.id as service_id, s."isActive" as active1, s.isactive as active2, t.name as treatment_name 
        FROM services s 
        LEFT JOIN treatments t ON t.id = s."treatmentId" OR t.id = s.treatmentid
      `);
      console.log('Services found:', res.length);
      console.log(JSON.stringify(res, null, 2));
      await connection.close();
  } catch (err) {
      console.error('FAILED:', err.message);
  }
}

check();
