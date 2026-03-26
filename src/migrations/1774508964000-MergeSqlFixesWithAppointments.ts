import { MigrationInterface, QueryRunner } from "typeorm";

export class MergeSqlFixesWithAppointments1774508964000 implements MigrationInterface {
    name = 'MergeSqlFixesWithAppointments1774508964000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Columns from fix-appointments-columns.sql
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMPTZ');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "cancelledById" UUID');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "noShowMarkedAt" TIMESTAMPTZ');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "noShowMarkedById" UUID');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "showStatus" VARCHAR(20)');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "serviceExecuted" BOOLEAN NOT NULL DEFAULT FALSE');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "followUpServiceId" VARCHAR');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "clinicNotes" TEXT');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "bookedById" UUID');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "appointmentCompletionReport" JSON');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10,2)');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ');
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "appointmentSource" VARCHAR(50) NOT NULL DEFAULT \'platform_broker\'');

        // 2. Column from fix-isreturned-column.sql
        await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "isReturned" BOOLEAN NOT NULL DEFAULT FALSE');

        // 3. Constraints
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_appointments_cancelledById') THEN
                    ALTER TABLE appointments ADD CONSTRAINT "FK_appointments_cancelledById" FOREIGN KEY ("cancelledById") REFERENCES users(id) ON DELETE SET NULL;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_appointments_noShowMarkedById') THEN
                    ALTER TABLE appointments ADD CONSTRAINT "FK_appointments_noShowMarkedById" FOREIGN KEY ("noShowMarkedById") REFERENCES users(id) ON DELETE SET NULL;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_appointments_bookedById') THEN
                    ALTER TABLE appointments ADD CONSTRAINT "FK_appointments_bookedById" FOREIGN KEY ("bookedById") REFERENCES users(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Safe skip for cleanup
    }
}
