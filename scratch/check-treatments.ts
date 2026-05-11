import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { Treatment } from '../src/modules/clinics/entities/treatment.entity';
import { Service } from '../src/modules/clinics/entities/service.entity';

dotenv.config();

async function check() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [Treatment, Service],
    synchronize: false,
  });

  try {
    const treatments = await connection.getRepository(Treatment).find();
    console.log('Total treatments:', treatments.length);
    console.log('Sample treatments:', treatments.slice(0, 5).map(t => ({ name: t.name, category: t.category, isActive: t.isActive, status: t.status })));

    const services = await connection.getRepository(Service).find({ relations: ['treatment'] });
    console.log('Total services:', services.length);
    console.log('Active services with treatment:', services.filter(s => s.isActive).length);
    
    const searchTerm = '%skin care%';
    const results = await connection.getRepository(Treatment).createQueryBuilder('t')
        .where('t.name ILIKE :term OR t.category ILIKE :term', { term: searchTerm })
        .getMany();
    console.log('Treatments matching "skin care":', results.map(t => t.name));

  } catch (error) {
    console.error(error);
  } finally {
    await connection.close();
  }
}

check();
