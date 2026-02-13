
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('--- Checking appointments table schema ---');
    const result = await dataSource.query(`
        SELECT column_name, is_nullable, column_default, data_type
        FROM information_schema.columns
        WHERE table_name = 'appointments' AND column_name = 'providerId';
    `);
    console.log(JSON.stringify(result, null, 2));

    console.log('--- Attempting to fix schema if needed ---');
    if (result.length > 0 && result[0].is_nullable === 'NO') {
        console.log('Column is NOT NULL. Fixing...');
        await dataSource.query('ALTER TABLE appointments ALTER COLUMN "providerId" DROP NOT NULL;');
        console.log('Fixed.');
    } else {
        console.log('Column is already nullable or does not exist.');
    }

    await app.close();
}

bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
});
