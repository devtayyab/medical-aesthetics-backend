import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getConnectionToken());

    const res = await dataSource.query(`
      SELECT id, status, "showStatus", "serviceExecuted", "treatmentDetails" FROM appointments ORDER BY "createdAt" DESC LIMIT 5
    `);
    console.log("Appointments:", res);

    await app.close();
}

bootstrap();
