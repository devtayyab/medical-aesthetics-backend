import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CrmService } from '../modules/crm/crm.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const crmService = app.get(CrmService);

  const kpis = await crmService.getManagerAgentKpis();
  console.dir(kpis, { depth: null });
  
  await app.close();
  process.exit(0);
}
bootstrap().catch(console.error);
