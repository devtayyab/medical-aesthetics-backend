import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getConnectionToken());

    const res = await dataSource.query(`
      SELECT 
        cr."assignedSalespersonId",
        apt.status,
        COUNT(apt.id) as cnt
      FROM appointments apt
      INNER JOIN customer_records cr ON cr."customerId" = apt."clientId"
      WHERE cr."assignedSalespersonId" IS NOT NULL
      GROUP BY cr."assignedSalespersonId", apt.status
    `);
    console.log("Status breakdown for salesperson's customers:", res);

    await app.close();
}

bootstrap();
