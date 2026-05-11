
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Treatment } from './src/modules/clinics/entities/treatment.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const treatmentRepo = app.get<Repository<Treatment>>(getRepositoryToken(Treatment));
  
  const treatments = await treatmentRepo.find();
  console.log('TOTAL TREATMENTS:', treatments.length);
  console.log('TREATMENT NAMES:', treatments.map(t => t.name));
  
  await app.close();
}
bootstrap();
