import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { Treatment } from '../src/modules/clinics/entities/treatment.entity';
import { Service } from '../src/modules/clinics/entities/service.entity';
import { TreatmentCategory } from '../src/modules/clinics/entities/treatment-category.entity';
import { Clinic } from '../src/modules/clinics/entities/clinic.entity';

dotenv.config();

async function check() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [Treatment, Service, TreatmentCategory, Clinic],
    synchronize: false,
  });

  try {
    const query = 'skin care';
    const searchTerm = `%${query}%`;
    
    // 1. Search in treatments that have active services
    const servicesWithTreatments = await connection.getRepository(Service)
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.treatment', 't')
      .where('s.isActive = :isActive', { isActive: true })
      .andWhere('(t.name ILIKE :term OR t.category ILIKE :term)', { term: searchTerm })
      .select(['t.name', 't.category'])
      .limit(20)
      .getMany();

    console.log('Services with treatments results:', servicesWithTreatments.length);

    const combined = new Set<string>();
    servicesWithTreatments.forEach((s) => {
      if (s.treatment?.name) combined.add(s.treatment.name);
      if (s.treatment?.category) combined.add(s.treatment.category);
    });

    // 2. Fallback search directly in treatments
    const directTreatments = await connection.getRepository(Treatment)
      .createQueryBuilder('t')
      // .where('t.status = :status', { status: 'approved' }) // Use string since enum might be tricky in scratch
      .andWhere('(t.name ILIKE :term OR t.category ILIKE :term)', { term: searchTerm })
      .select(['t.name', 't.category'])
      .limit(10)
      .getMany();

    console.log('Direct treatments results:', directTreatments.length);

    directTreatments.forEach((t) => {
      if (t.name) combined.add(t.name);
      if (t.category) combined.add(t.category);
    });

    console.log('Final suggestions:', Array.from(combined).slice(0, 15));

  } catch (error) {
    console.error(error);
  } finally {
    await connection.close();
  }
}

check();
