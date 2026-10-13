import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCrmPerformanceIndexes1787300000000 implements MigrationInterface {
    name = 'AddCrmPerformanceIndexes1787300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fast ordering and filtering indexes for leads
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_leads_coalesce_sort" 
            ON "leads" ((COALESCE("lastMetaFormSubmittedAt" AT TIME ZONE 'UTC', "createdAt")) DESC, "createdAt" DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_leads_status_not_converted_lost" 
            ON "leads" ("status") WHERE "status" NOT IN ('converted', 'lost');
        `);

        // Fast query and foreign-key join indexes for crm_actions
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_actions_salespersonId" ON "crm_actions" ("salespersonId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_actions_status" ON "crm_actions" ("status");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_actions_dueDate" ON "crm_actions" ("dueDate");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_actions_customerId" ON "crm_actions" ("customerId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_actions_relatedLeadId" ON "crm_actions" ("relatedLeadId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crm_actions_sort_pending" ON "crm_actions" ("status", "dueDate" ASC);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_sort_pending"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_relatedLeadId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_customerId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_dueDate"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_crm_actions_salespersonId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_status_not_converted_lost"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leads_coalesce_sort"`);
    }
}
