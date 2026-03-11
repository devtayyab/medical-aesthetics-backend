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
        COUNT(apt.id) as booked,
        COUNT(CASE WHEN apt.status = 'completed' THEN 1 END) as attended,
        SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) as attended2,
        COUNT(CASE WHEN apt.status = 'completed' AND apt."treatmentDetails" IS NOT NULL THEN 1 END) as treatmentsCompleted
      FROM appointments apt
      INNER JOIN customer_records cr ON cr."customerId" = apt."clientId"
      LEFT JOIN users agent ON agent.id = cr."assignedSalespersonId"
      WHERE cr."assignedSalespersonId" IS NOT NULL
      GROUP BY cr."assignedSalespersonId"
    `);
    console.log("Raw query results:", res);

    await app.close();
}

bootstrap();
