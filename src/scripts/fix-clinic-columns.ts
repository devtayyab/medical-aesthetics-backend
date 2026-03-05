import { Client } from 'pg';
import { config } from 'dotenv';
config();

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'medical_aesthetics',
});

async function fix() {
    await client.connect();
    console.log('Connected to DB');

    try {
        const checkColumns = async (col: string) => {
            const res = await client.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = $1`,
                [col]
            );
            return res.rowCount > 0;
        };

        if (!(await checkColumns('photoUrl'))) {
            console.log('Adding photoUrl...');
            await client.query(`ALTER TABLE "clinics" ADD "photoUrl" character varying`);
        }

        if (!(await checkColumns('treatmentRooms'))) {
            console.log('Adding treatmentRooms...');
            await client.query(`ALTER TABLE "clinics" ADD "treatmentRooms" integer NOT NULL DEFAULT 1`);
        }

        if (!(await checkColumns('rating'))) {
            console.log('Adding rating...');
            await client.query(`ALTER TABLE "clinics" ADD "rating" numeric(3,2) NOT NULL DEFAULT 0`);
        }

        if (!(await checkColumns('reviewCount'))) {
            console.log('Adding reviewCount...');
            await client.query(`ALTER TABLE "clinics" ADD "reviewCount" integer NOT NULL DEFAULT 0`);
        }

        if (!(await checkColumns('timezone'))) {
            console.log('Adding timezone...');
            await client.query(`ALTER TABLE "clinics" ADD "timezone" character varying`);
        }

        if (!(await checkColumns('ownerId'))) {
            console.log('Adding ownerId...');
            await client.query(`ALTER TABLE "clinics" ADD "ownerId" uuid`);
        }

        console.log('Success: All missing columns checked/added!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fix();
