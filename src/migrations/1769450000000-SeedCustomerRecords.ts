import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedCustomerRecords1769450000000 implements MigrationInterface {
    name = 'SeedCustomerRecords1769450000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert missing customer_records for existing clients
        await queryRunner.query(`
            INSERT INTO "customer_records" (
                "id", 
                "customerId", 
                "customerStatus", 
                "lifetimeValue", 
                "totalAppointments", 
                "completedAppointments", 
                "cancelledAppointments", 
                "isRepeatCustomer",
                "createdAt", 
                "updatedAt"
            )
            SELECT 
                uuid_generate_v4(), 
                "id", 
                'new', 
                0, 
                0, 
                0, 
                0, 
                false,
                now(), 
                now()
            FROM "users"
            WHERE "role" = 'client'
            AND "id" NOT IN (SELECT "customerId" FROM "customer_records")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No simple way to identify automatically seeded records without potentially deleting legit ones.
        // So we leave this empty or could delete creation based on a timestamp if strictly needed.
    }
}
