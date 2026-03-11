import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CrmService } from '../modules/crm/crm.service';
import { getConnectionToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const crmService = app.get(CrmService);

    const stats = await crmService.getAgentAppointmentStats();
    console.log("Appt Stats:", JSON.stringify(stats, null, 2));
    
    const dataSource = app.get<DataSource>(getConnectionToken());
    const rawCounts = await dataSource.query(`
      SELECT "bookedById", "status", count(*) 
      FROM appointments 
      GROUP BY "bookedById", "status"
    `);
    console.log("Raw status counts grouped by bookedById:", rawCounts);

    await app.close();
}

bootstrap();
