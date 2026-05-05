import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Treatment } from './modules/clinics/entities/treatment.entity';
import { Service } from './modules/clinics/entities/service.entity';

async function debugData() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    
    const treatments = await dataSource.getRepository(Treatment).find();
    console.log('--- Treatments ---');
    console.log(`Total: ${treatments.length}`);
    console.table(treatments.slice(0, 10).map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        imageUrl: t.imageUrl ? (t.imageUrl.substring(0, 30) + '...') : 'null'
    })));

    const services = await dataSource.getRepository(Service).find({
        relations: ['treatment', 'clinic']
    });
    console.log('--- Services ---');
    console.log(`Total: ${services.length}`);
    console.table(services.slice(0, 10).map(s => ({
        id: s.id,
        treatmentName: s.treatment?.name,
        clinicName: s.clinic?.name,
        isActive: s.isActive,
        clinicActive: s.clinic?.isActive
    })));

    await app.close();
}

debugData().catch(console.error);
