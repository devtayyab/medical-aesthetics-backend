import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get<DataSource>(getConnectionToken());

    const res = await dataSource.query(`
      SELECT 
        apt."bookedById" as "agentId",
        agent."firstName",
        agent."lastName",
        COUNT(apt.id) as booked,
        COUNT(CASE WHEN apt.status = 'completed' THEN 1 END) as attended,
        COUNT(CASE WHEN apt.status = 'completed' AND apt."treatmentDetails" IS NOT NULL THEN 1 END) as treatmentsCompleted
      FROM appointments apt
      LEFT JOIN users agent ON agent.id = apt."bookedById"
      WHERE apt."bookedById" IS NOT NULL
      GROUP BY apt."bookedById", agent."firstName", agent."lastName"
    `);
    console.log("Stats based on bookedById:", res);

    await app.close();
}

bootstrap();
