
import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddReferralCodeToUsers1769210000000 implements MigrationInterface {
    name = 'AddReferralCodeToUsers1769210000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("users");
        if (table) {
            const hasReferralCode = table.columns.find(column => column.name === "referralCode");
            const hasReferredById = table.columns.find(column => column.name === "referredById");
            const hasRefreshToken = table.columns.find(column => column.name === "refreshToken");

            if (!hasReferralCode) {
                await queryRunner.addColumn("users", new TableColumn({
                    name: "referralCode",
                    type: "varchar",
                    isUnique: true,
                    isNullable: true
                }));
            }

            if (!hasReferredById) {
                await queryRunner.addColumn("users", new TableColumn({
                    name: "referredById",
                    type: "uuid",
                    isNullable: true
                }));

                await queryRunner.createForeignKey("users", new TableForeignKey({
                    columnNames: ["referredById"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "NO ACTION"
                }));
            }

            if (!hasRefreshToken) {
                await queryRunner.addColumn("users", new TableColumn({
                    name: "refreshToken",
                    type: "varchar",
                    isNullable: true
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
