import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddScheduledAtToLeads1775818475683 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "leads",
            new TableColumn({
                name: "scheduledAt",
                type: "timestamptz",
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("leads", "scheduledAt");
    }

}
