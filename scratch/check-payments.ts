import { createConnection } from 'typeorm';
import { PaymentRecord } from '../src/modules/payments/entities/payment-record.entity';
import { Clinic } from '../src/modules/clinics/entities/clinic.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Appointment } from '../src/modules/bookings/entities/appointment.entity';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'medical_aesthetics',
    entities: [PaymentRecord, Clinic, User, Appointment],
    synchronize: false,
  });

  const repo = connection.getRepository(PaymentRecord);
  const count = await repo.count();
  console.log(`TOTAL PAYMENT RECORDS: ${count}`);

  const payments = await repo.find({
    order: { createdAt: 'DESC' },
    relations: ['client', 'clinic'],
    take: 10
  });

  console.log('LATEST 10 PAYMENTS:');
  payments.forEach(p => {
    console.log(`- ID: ${p.id}, Amount: €${p.amount}, Date: ${p.createdAt.toISOString()}, Client: ${p.client ? p.client.firstName + ' ' + p.client.lastName : 'None'}, Clinic: ${p.clinic ? p.clinic.name : 'None'}`);
  });

  await connection.close();
}

check().catch(console.error);
