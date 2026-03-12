import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFacebookAdNameToLeads1773276729503 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("leads");
        if (table && !table.columns.find(c => c.name === "facebookAdName")) {
            await queryRunner.addColumn("leads", new TableColumn({
                name: "facebookAdName",
                type: "varchar",
                isNullable: true
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("leads");
        if (table && table.columns.find(c => c.name === "facebookAdName")) {
            await queryRunner.dropColumn("leads", "facebookAdName");
        }
    }

}
