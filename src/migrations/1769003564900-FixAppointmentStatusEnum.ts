import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAppointmentStatusEnum1769003564900 implements MigrationInterface {
    name = 'FixAppointmentStatusEnum1769003564900'
    public transaction = false;

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure appointments_status_enum includes all current TS enum values
        const newValues = [
            'PENDING', 
            'PENDING_PAYMENT', 
            'CONFIRMED', 
            'IN_PROGRESS', 
            'COMPLETED', 
            'CANCELLED', 
            'ARRIVED', 
            'NO_SHOW',
            'DELETED',
            'EXECUTED'
        ];

        for (const val of newValues) {
            // We use DO logic to add value ONLY if it doesn't exist, to avoid errors on subsequent runs
            // PostgreSQL ADD VALUE cannot be run inside a transaction blocks easily in some versions, 
            // but TypeORM runs migrations in transactions. 
            // However, ADD VALUE usually works fine with check.
            await queryRunner.query(`
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointments_status_enum') THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'appointments_status_enum' AND e.enumlabel = '${val}') THEN
                            ALTER TYPE "appointments_status_enum" ADD VALUE '${val}';
                        END IF;
                    END IF;
                END $$;
            `);
        }

        // 2. Fallback: If the column is still varchar but they want to use it as enum, 
        // OR if there's a constraint, this ADD VALUE covers it if it's an enum.
        // If it's varchar, why did it error? likely it IS an enum in the environment that errored.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Enums values cannot be easily removed in PostgreSQL
    }
}
