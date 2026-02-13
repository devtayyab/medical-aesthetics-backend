
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddManagerRoleToEnum1769600000002 implements MigrationInterface {
    name = 'AddManagerRoleToEnum1769600000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL doesn't support adding enum values within a transaction easily in older versions,
        // but for modern Postgres we can use ALTER TYPE ... ADD VALUE.
        // We use check to avoid "already exists" error.
        await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'manager'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Removing a value from an ENUM is complex in Postgres (requires recreating the type).
        // Usually, we just leave it or handle it if strictly necessary.
        // For development/local, we can ignore the 'down' for now or log a warning.
        console.warn("Down migration for ENUM value removal is not straightforward in PostgreSQL and is skipped.");
    }
}
