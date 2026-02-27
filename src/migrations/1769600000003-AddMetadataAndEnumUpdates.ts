import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddMetadataAndEnumUpdates1769600000003 implements MigrationInterface {
    name = 'AddMetadataAndEnumUpdates1769600000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add metadata to customer_records (JSON)
        const customerRecordsTable = await queryRunner.getTable("customer_records");
        if (customerRecordsTable && !customerRecordsTable.columns.find(c => c.name === "metadata")) {
            await queryRunner.addColumn("customer_records", new TableColumn({
                name: "metadata",
                type: "json",
                isNullable: true
            }));
        }

        // 2. Add relatedLeadId to crm_actions and FK
        const crmActionsTable = await queryRunner.getTable("crm_actions");
        if (crmActionsTable) {
            if (!crmActionsTable.columns.find(c => c.name === "relatedLeadId")) {
                await queryRunner.addColumn("crm_actions", new TableColumn({
                    name: "relatedLeadId",
                    type: "uuid",
                    isNullable: true
                }));

                await queryRunner.createForeignKey("crm_actions", new TableForeignKey({
                    columnNames: ["relatedLeadId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "leads",
                    onDelete: "SET NULL"
                }));
            }

            // 3. Update actionType enum
            // Add missing values to crm_actions_actiontype_enum
            const enumValues = ['call', 'mobile_message', 'follow_up_call', 'appointment', 'confirmation_call_reminder'];
            for (const value of enumValues) {
                // PosgreSQL specific syntax to add to enum
                await queryRunner.query(`ALTER TYPE "public"."crm_actions_actiontype_enum" ADD VALUE IF NOT EXISTS '${value}'`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const crmActionsTable = await queryRunner.getTable("crm_actions");
        if (crmActionsTable) {
            const foreignKey = crmActionsTable.foreignKeys.find(fk => fk.columnNames.indexOf("relatedLeadId") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("crm_actions", foreignKey);
            }
            if (crmActionsTable.columns.find(c => c.name === "relatedLeadId")) {
                await queryRunner.dropColumn("crm_actions", "relatedLeadId");
            }
        }

        const customerRecordsTable = await queryRunner.getTable("customer_records");
        if (customerRecordsTable && customerRecordsTable.columns.find(c => c.name === "metadata")) {
            await queryRunner.dropColumn("customer_records", "metadata");
        }

        // Note: Removing values from Enum is not easily supported in PostgreSQL without recreating the type
    }
}
