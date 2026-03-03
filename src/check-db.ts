import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function checkCols() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    const cols = await queryRunner.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'appointments'
  `);

    console.log('--- Appointments Columns ---');
    console.table(cols);

    await queryRunner.release();
    await app.close();
}

checkCols().catch(console.error);
