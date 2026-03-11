import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CrmService } from '../modules/crm/crm.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const crmService = app.get(CrmService);

  const stats = await crmService.getServiceStats();
  console.log('getServiceStats:', stats);
  
  await app.close();
  process.exit(0);
}
bootstrap().catch(console.error);
