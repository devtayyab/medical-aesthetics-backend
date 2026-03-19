import { createConnection } from 'typeorm';
import { Appointment } from '../modules/bookings/entities/appointment.entity';
import { User } from '../modules/users/entities/user.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Treatment } from '../modules/clinics/entities/treatment.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkJoiyaClinic() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Appointment, User, Clinic, Service, Treatment],
    synchronize: false,
  });

  const clinic = await connection.getRepository(Clinic).findOne({
      where: { name: 'joiya clinic' }
  });

  if (!clinic) {
      console.log('Joiya Clinic not found');
      await connection.close();
      return;
  }

  console.log(`Clinic ID: ${clinic.id}`);
  
  const services = await connection.getRepository(Service).find({
      where: { clinicId: clinic.id },
      relations: ['treatment']
  });

  console.log(`\nTotal Services found for Joiya Clinic: ${services.length}`);
  services.forEach(s => {
      console.log(`- Service ID: ${s.id}`);
      console.log(`  Price: ${s.price}`);
      console.log(`  IsActive: ${s.isActive}`);
      console.log(`  Treatment Name: ${s.treatment?.name}`);
      console.log(`  Treatment IsActive: ${s.treatment?.isActive}`);
      console.log(`  Treatment Status: ${s.treatment?.status}`);
  });

  await connection.close();
}

checkJoiyaClinic().catch(console.error);
