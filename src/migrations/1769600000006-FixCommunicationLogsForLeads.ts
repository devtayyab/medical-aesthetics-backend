import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class FixCommunicationLogsForLeads1769600000006 implements MigrationInterface {
    name = 'FixCommunicationLogsForLeads1769600000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Make customerId nullable in communication_logs
        await queryRunner.changeColumn("communication_logs", "customerId", new TableColumn({
            name: "customerId",
            type: "uuid",
            isNullable: true
        }));

        // 2. Add relatedLeadId to communication_logs
        await queryRunner.addColumn("communication_logs", new TableColumn({
            name: "relatedLeadId",
            type: "uuid",
            isNullable: true
        }));

        // 3. Add Foreign Key for relatedLeadId
        await queryRunner.createForeignKey("communication_logs", new TableForeignKey({
            name: "FK_communication_logs_relatedLeadId_leads",
            columnNames: ["relatedLeadId"],
            referencedColumnNames: ["id"],
            referencedTableName: "leads",
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Remove Foreign Key
        await queryRunner.dropForeignKey("communication_logs", "FK_communication_logs_relatedLeadId_leads");

        // 2. Drop column
        await queryRunner.dropColumn("communication_logs", "relatedLeadId");

        // 3. Revert customerId to NOT NULL (if possible, ensuring no nulls exist)
        // Note: Reverting to NOT NULL might fail if there are records with NULL customerId.
        // For 'down', we'll keep it nullable or warn.
        await queryRunner.changeColumn("communication_logs", "customerId", new TableColumn({
            name: "customerId",
            type: "uuid",
            isNullable: false
        }));
    }
}
