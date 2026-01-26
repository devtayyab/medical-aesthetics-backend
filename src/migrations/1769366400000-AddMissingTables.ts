import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class AddMissingTables1769366400000 implements MigrationInterface {
    name = 'AddMissingTables1769366400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create blocked_time_slots table if it doesn't exist
        const tableExists = await queryRunner.hasTable("blocked_time_slots");
        if (!tableExists) {
            await queryRunner.createTable(new Table({
                name: "blocked_time_slots",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "clinicId",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "providerId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "startTime",
                        type: "timestamp with time zone",
                        isNullable: false
                    },
                    {
                        name: "endTime",
                        type: "timestamp with time zone",
                        isNullable: false
                    },
                    {
                        name: "reason",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "blockedById",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }), true);

            // Add Foreign Keys for blocked_time_slots
            await queryRunner.createForeignKey(
                "blocked_time_slots",
                new TableForeignKey({
                    columnNames: ["clinicId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "clinics",
                    onDelete: "CASCADE"
                })
            );

            await queryRunner.createForeignKey(
                "blocked_time_slots",
                new TableForeignKey({
                    columnNames: ["providerId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                })
            );

            await queryRunner.createForeignKey(
                "blocked_time_slots",
                new TableForeignKey({
                    columnNames: ["blockedById"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                })
            );
        }

        // 2. Add appointmentSource column to appointments table if it doesn't exist
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            const hasSourceColumn = appointmentTable.columns.find(column => column.name === "appointmentSource");
            if (!hasSourceColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "appointmentSource",
                    type: "varchar",
                    isNullable: true,
                    default: "'direct'"
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop appointmentSource column
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            const hasSourceColumn = appointmentTable.columns.find(column => column.name === "appointmentSource");
            if (hasSourceColumn) {
                await queryRunner.dropColumn("appointments", "appointmentSource");
            }
        }

        // Drop blocked_time_slots table
        if (await queryRunner.hasTable("blocked_time_slots")) {
            await queryRunner.dropTable("blocked_time_slots");
        }
    }
}
