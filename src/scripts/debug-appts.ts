import { createConnection } from 'typeorm';
import { Appointment } from '../modules/bookings/entities/appointment.entity';
import { User } from '../modules/users/entities/user.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Treatment } from '../modules/clinics/entities/treatment.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAppointments() {
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

  console.log('--- Recent Appointments ---');
  const appointments = await connection.getRepository(Appointment).find({
    order: { createdAt: 'DESC' },
    take: 5,
    relations: ['clinic', 'client'],
  });

  appointments.forEach(apt => {
    console.log(`ID: ${apt.id}`);
    console.log(`Clinic: ${apt.clinic?.name} (${apt.clinicId})`);
    console.log(`Status: ${apt.status}`);
    console.log(`Created At: ${apt.createdAt}`);
    console.log(`Client: ${apt.client?.firstName} ${apt.client?.lastName}`);
    console.log('---------------------------');
  });

  console.log('\n--- Recent Services ---');
  const services = await connection.getRepository(Service).find({
      take: 10,
      relations: ['clinic', 'treatment']
  });
  services.forEach(s => {
      console.log(`Service ID: ${s.id}`);
      console.log(`Clinic: ${s.clinic?.name}`);
      console.log(`Treatment: ${s.treatment?.name} (Active: ${s.treatment?.isActive})`);
      console.log(`Service Active: ${s.isActive}`);
      console.log('---------------------------');
  });

  await connection.close();
}

checkAppointments().catch(console.error);
