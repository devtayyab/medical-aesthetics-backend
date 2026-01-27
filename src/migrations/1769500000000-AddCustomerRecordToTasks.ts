import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddCustomerRecordToTasks1769500000000 implements MigrationInterface {
    name = 'AddCustomerRecordToTasks1769500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("tasks");
        if (table && !table.columns.find(c => c.name === "customerRecordId")) {
            await queryRunner.addColumn("tasks", new TableColumn({
                name: "customerRecordId",
                type: "uuid",
                isNullable: true
            }));

            await queryRunner.createForeignKey("tasks", new TableForeignKey({
                columnNames: ["customerRecordId"],
                referencedColumnNames: ["id"],
                referencedTableName: "customer_records",
                onDelete: "SET NULL"
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("tasks");
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("customerRecordId") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("tasks", foreignKey);
            }
            if (table.columns.find(c => c.name === "customerRecordId")) {
                await queryRunner.dropColumn("tasks", "customerRecordId");
            }
        }
    }
}
