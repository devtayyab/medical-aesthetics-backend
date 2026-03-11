import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CrmService } from '../modules/crm/crm.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const crmService = app.get(CrmService);

    const stats = await crmService.getAgentCommunicationStats();
    console.log("Comms Stats:", JSON.stringify(stats, null, 2));

    await app.close();
}

bootstrap();
