import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClinicOwnership } from './modules/crm/entities/clinic-ownership.entity';

async function checkMetadata() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get(getRepositoryToken(ClinicOwnership));
  try {
    console.log('Metadata Table Name:', repo.metadata.tableName);
    console.log('Metadata Columns:', repo.metadata.columns.map(c => c.propertyName));
  } catch (err) {
    console.error('Metadata Error:', err.message);
  }
  await app.close();
}

checkMetadata();
