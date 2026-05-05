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
    servicesCols.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));

    await queryRunner.release();
    await app.close();
}

checkSchema().catch(console.error);
