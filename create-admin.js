const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
    console.log("Connecting to database...");
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'medical_aesthetics',
    });

    try {
        await client.connect();
        console.log("Connected!");

        const email = 'admin@example.com';

        // Check if exists
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0) {
            console.log("Admin user already exists.");
            return;
        }

        const passwordHash = await bcrypt.hash('Admin123!', 10);

        // Insert (Assuming uuid_generate_v4() works in DB, or we generate one in JS)
        // Note: Default value for ID is uuid_generate_v4() in schema, so we can skip ID or generate one.
        // Let's rely on DB default if possible, or use 'uuid' lib if needed.
        // The schema says: "id" uuid NOT NULL DEFAULT uuid_generate_v4()

        await client.query(`
            INSERT INTO users (
                "id", "email", "passwordHash", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt"
            ) VALUES (
                uuid_generate_v4(), $1, $2, 'System', 'Admin', 'admin', true, now(), now()
            )
        `, [email, passwordHash]);

        console.log("Admin created successfully!");
        console.log("Email:", email);
        console.log("Password: Admin123!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

createAdmin();
