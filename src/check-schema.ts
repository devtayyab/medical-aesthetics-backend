import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function checkSchema() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    const servicesCols = await queryRunner.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'services'
    `);
    console.log('--- Services Table Columns ---');
    console.table(servicesCols);

    const treatmentsCols = await queryRunner.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'treatments'
    `);
    console.log('--- Treatments Table Columns ---');
    console.table(treatmentsCols);

    await queryRunner.release();
    await app.close();
}

checkSchema().catch(console.error);
