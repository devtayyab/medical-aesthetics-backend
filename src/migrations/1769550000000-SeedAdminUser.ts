import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class SeedAdminUser1769550000000 implements MigrationInterface {
    name = 'SeedAdminUser1769550000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create Admin User
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        // We use INSERT ... ON CONFLICT DO NOTHING to avoid duplicate errors if run multiple times
        await queryRunner.query(`
            INSERT INTO "users" (
                "id", 
                "email", 
                "passwordHash", 
                "firstName", 
                "lastName", 
                "role", 
                "isActive", 
                "createdAt", 
                "updatedAt"
            ) VALUES (
                uuid_generate_v4(), 
                'admin@example.com', 
                '${hashedPassword}', 
                'System', 
                'Admin', 
                'admin', 
                true, 
                now(), 
                now()
            )
            ON CONFLICT ("email") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "users" WHERE "email" = 'admin@example.com'`);
    }
}
