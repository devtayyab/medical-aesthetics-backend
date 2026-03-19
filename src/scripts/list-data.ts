import { createConnection } from 'typeorm';
import { TreatmentCategory } from '../modules/clinics/entities/treatment-category.entity';
import { Treatment } from '../modules/clinics/entities/treatment.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function listCurrentData() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [TreatmentCategory, Treatment, Service],
    synchronize: false,
  });

  const categories = await connection.getRepository(TreatmentCategory).find();
  console.log('--- Current Categories ---');
  categories.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));

  const treatments = await connection.getRepository(Treatment).find({ relations: ['categoryRef'] });
  console.log('\n--- Current Treatments ---');
  treatments.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}, Category: ${t.categoryRef?.name || t.category}`));

  await connection.close();
}

listCurrentData().catch(console.error);
