import { DataSource } from 'typeorm';
import { Appointment } from '../src/modules/bookings/entities/appointment.entity';
import { DatabaseConfig } from '../src/config/database.config';
import { ConfigService } from '@nestjs/config';

async function check() {
    const configService = new ConfigService();
    const dbConfig = new DatabaseConfig(configService);
    const options = await dbConfig.createTypeOrmOptions();
    const dataSource = new DataSource(options as any);
    await dataSource.initialize();

    const repo = dataSource.getRepository(Appointment);
    
    // Check May 11, 12, 14
    const dates = ['2026-05-11', '2026-05-12', '2026-05-14'];
    
    for (const date of dates) {
        const start = new Date(date + 'T00:00:00.000Z');
        const end = new Date(date + 'T23:59:59.999Z');
        
        const apts = await repo.createQueryBuilder('a')
            .where('a.startTime BETWEEN :start AND :end', { start, end })
            .getMany();
            
        console.log(`Date: ${date}, Count (UTC Range): ${apts.length}`);
        
        // Check without T...Z (Local-ish?)
        const startLocal = new Date(date + ' 00:00:00');
        const endLocal = new Date(date + ' 23:59:59');
        const aptsLocal = await repo.createQueryBuilder('a')
            .where('a.startTime BETWEEN :start AND :end', { start: startLocal, end: endLocal })
            .getMany();
        console.log(`Date: ${date}, Count (Local Range): ${aptsLocal.length}`);
    }

    await dataSource.destroy();
}

check().catch(console.error);
