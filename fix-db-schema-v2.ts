
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log('--- Detailed table info for appointments ---');
    const cols = await dataSource.query(`
        SELECT column_name, is_nullable, column_default, data_type
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        ORDER BY ordinal_position;
    `);
    console.table(cols);

    console.log('--- Constraints for appointments ---');
    const constraints = await dataSource.query(`
        SELECT conname, contype, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE conrelid = 'appointments'::regclass;
    `);
    console.table(constraints);

    console.log('--- Fixing providerId if needed ---');
    await dataSource.query('ALTER TABLE appointments ALTER COLUMN "providerId" DROP NOT NULL;');
    console.log('Done.');

    await app.close();
}

bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
});
