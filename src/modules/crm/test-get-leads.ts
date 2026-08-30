import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CrmService } from './crm.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const crmService = app.get(CrmService);

  try {
    const leads = await crmService.findAll({ limit: 50, page: 1, all: true });
    console.log('Leads fetched successfully:', leads.length);
  } catch (error) {
    console.error('Error fetching leads:', error);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
