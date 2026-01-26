
import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOrphanedCrmActions1769200000000 implements MigrationInterface {
    name = 'FixOrphanedCrmActions1769200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasCrmActions = await queryRunner.hasTable("crm_actions");
        const hasCustomerRecords = await queryRunner.hasTable("customer_records");

        if (hasCrmActions && hasCustomerRecords) {
            await queryRunner.query(`DELETE FROM "crm_actions" WHERE "customerId" NOT IN (SELECT "id" FROM "customer_records")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
