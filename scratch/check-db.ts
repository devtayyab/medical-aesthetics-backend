import { createConnection } from 'typeorm';
import { Treatment } from '../src/modules/clinics/entities/treatment.entity';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connection = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Treatment],
    synchronize: false,
  });

  const treatments = await connection.getRepository(Treatment).find({ take: 20 });
  console.log('TREATMENTS IN DB:');
  treatments.forEach(t => console.log(`- ${t.name} (${t.category}) [Status: ${t.status}]`));
  
  await connection.close();
}

check().catch(console.error);
