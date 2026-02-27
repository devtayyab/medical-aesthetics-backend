import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class MakeSubjectNullableInCommunicationLogs1769600000007 implements MigrationInterface {
    name = 'MakeSubjectNullableInCommunicationLogs1769600000007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("communication_logs", "subject", new TableColumn({
            name: "subject",
            type: "text",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("communication_logs", "subject", new TableColumn({
            name: "subject",
            type: "text",
            isNullable: false
        }));
    }
}
