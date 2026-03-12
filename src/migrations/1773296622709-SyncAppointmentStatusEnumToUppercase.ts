import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncAppointmentStatusEnumToUppercase1773296622709 implements MigrationInterface {
    public transaction = false;

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure all values exist in appointments_status_enum (UPPERCASE)
        const values = [
            'PENDING', 
            'PENDING_PAYMENT', 
            'CONFIRMED', 
            'IN_PROGRESS', 
            'COMPLETED', 
            'CANCELLED', 
            'ARRIVED', 
            'NO_SHOW'
        ];

        for (const val of values) {
            await queryRunner.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'appointments_status_enum' AND e.enumlabel = '${val}') THEN
                        ALTER TYPE "appointments_status_enum" ADD VALUE '${val}';
                    END IF;
                END $$;
            `);
        }

        // 2. Map existing lowercase values to uppercase if they exist in the appointments table
        // We first check if the table exists to avoid errors in clean environments
        const hasAppointments = await queryRunner.hasTable("appointments");
        if (hasAppointments) {
            const mapping = {
                'pending': 'PENDING',
                'pending_payment': 'PENDING_PAYMENT',
                'confirmed': 'CONFIRMED',
                'in_progress': 'IN_PROGRESS',
                'completed': 'COMPLETED',
                'cancelled': 'CANCELLED',
                'no_show': 'NO_SHOW'
            };

            for (const [oldVal, newVal] of Object.entries(mapping)) {
                await queryRunner.query(`
                    UPDATE "appointments" SET "status" = '${newVal}' WHERE "status"::text = '${oldVal}'
                `);
            }

            // 3. Update the default value for the status column to uppercase
            await queryRunner.query(`
                ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING'
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasAppointments = await queryRunner.hasTable("appointments");
        if (hasAppointments) {
             await queryRunner.query(`
                ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending'
            `);
        }
    }
}
