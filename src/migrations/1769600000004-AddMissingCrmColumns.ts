import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMissingCrmColumns1769600000004 implements MigrationInterface {
    name = 'AddMissingCrmColumns1769600000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add missing columns to leads table
        const leadsTable = await queryRunner.getTable("leads");
        if (leadsTable) {
            if (!leadsTable.columns.find(c => c.name === "lastMetaFormSubmittedAt")) {
                await queryRunner.addColumn("leads", new TableColumn({
                    name: "lastMetaFormSubmittedAt",
                    type: "timestamptz",
                    isNullable: true
                }));
            }
            if (!leadsTable.columns.find(c => c.name === "lastMetaFormName")) {
                await queryRunner.addColumn("leads", new TableColumn({
                    name: "lastMetaFormName",
                    type: "varchar",
                    isNullable: true
                }));
            }
        }

        // 2. Add missing columns to crm_actions table
        const crmActionsTable = await queryRunner.getTable("crm_actions");
        if (crmActionsTable) {
            if (!crmActionsTable.columns.find(c => c.name === "therapy")) {
                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "therapy",
                    type: "varchar",
                    isNullable: true
                }));
            }
            if (!crmActionsTable.columns.find(c => c.name === "reminderDate")) {
                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "reminderDate",
                    type: "timestamptz",
                    isNullable: true
                }));
            }
            if (!crmActionsTable.columns.find(c => c.name === "isRecurring")) {
                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "isRecurring",
                    type: "boolean",
                    default: false
                }));
            }
            if (!crmActionsTable.columns.find(c => c.name === "recurrenceType")) {
                // Ensure enum type exists or just use varchar if enum creation is complex
                // The entity uses: type: 'enum', enum: ['daily', 'weekly', 'monthly', 'custom']
                await queryRunner.query(`DO $$ 
                    BEGIN 
                        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_actions_recurrencetype_enum') THEN
                            CREATE TYPE "public"."crm_actions_recurrencetype_enum" AS ENUM('daily', 'weekly', 'monthly', 'custom');
                        END IF;
                    END $$;`);

                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "recurrenceType",
                    type: "enum",
                    enumName: "crm_actions_recurrencetype_enum",
                    isNullable: true
                }));
            }
            if (!crmActionsTable.columns.find(c => c.name === "recurrenceInterval")) {
                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "recurrenceInterval",
                    type: "integer",
                    isNullable: true
                }));
            }
            if (!crmActionsTable.columns.find(c => c.name === "originalTaskId")) {
                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "originalTaskId",
                    type: "uuid",
                    isNullable: true
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const crmActionsTable = await queryRunner.getTable("crm_actions");
        if (crmActionsTable) {
            if (crmActionsTable.columns.find(c => c.name === "originalTaskId")) await queryRunner.dropColumn("crm_actions", "originalTaskId");
            if (crmActionsTable.columns.find(c => c.name === "recurrenceInterval")) await queryRunner.dropColumn("crm_actions", "recurrenceInterval");
            if (crmActionsTable.columns.find(c => c.name === "recurrenceType")) {
                await queryRunner.dropColumn("crm_actions", "recurrenceType");
                await queryRunner.query(`DROP TYPE IF EXISTS "public"."crm_actions_recurrencetype_enum"`);
            }
            if (crmActionsTable.columns.find(c => c.name === "isRecurring")) await queryRunner.dropColumn("crm_actions", "isRecurring");
            if (crmActionsTable.columns.find(c => c.name === "reminderDate")) await queryRunner.dropColumn("crm_actions", "reminderDate");
            if (crmActionsTable.columns.find(c => c.name === "therapy")) await queryRunner.dropColumn("crm_actions", "therapy");
        }

        const leadsTable = await queryRunner.getTable("leads");
        if (leadsTable) {
            if (leadsTable.columns.find(c => c.name === "lastMetaFormName")) await queryRunner.dropColumn("leads", "lastMetaFormName");
            if (leadsTable.columns.find(c => c.name === "lastMetaFormSubmittedAt")) await queryRunner.dropColumn("leads", "lastMetaFormSubmittedAt");
        }
    }
}
