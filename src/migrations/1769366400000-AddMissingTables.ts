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

            const hasShowStatusColumn = appointmentTable.columns.find(column => column.name === "showStatus");
            if (!hasShowStatusColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "showStatus",
                    type: "boolean", // Changed to boolean as it's typically boolean or enum, assuming boolean based on usage context or varchar 'pending' from previous attempt
                    isNullable: true,
                    default: true
                }));
            }

            const hasServiceExecutedColumn = appointmentTable.columns.find(column => column.name === "serviceExecuted");
            if (!hasServiceExecutedColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "serviceExecuted",
                    type: "boolean",
                    isNullable: true,
                    default: false
                }));
            }

            const hasFollowUpServiceIdColumn = appointmentTable.columns.find(column => column.name === "followUpServiceId");
            if (!hasFollowUpServiceIdColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "followUpServiceId",
                    type: "uuid",
                    isNullable: true
                }));
            }

            const hasClinicNotesColumn = appointmentTable.columns.find(column => column.name === "clinicNotes");
            if (!hasClinicNotesColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "clinicNotes",
                    type: "text",
                    isNullable: true
                }));
            }

            const hasAppointmentCompletionReportColumn = appointmentTable.columns.find(column => column.name === "appointmentCompletionReport");
            if (!hasAppointmentCompletionReportColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "appointmentCompletionReport",
                    type: "json",
                    isNullable: true
                }));
            }

            const hasCancellationReason = appointmentTable.columns.find(column => column.name === "cancellationReason");
            if (!hasCancellationReason) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "cancellationReason",
                    type: "text",
                    isNullable: true
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop appointmentSource column
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            if (appointmentTable.columns.find(c => c.name === "cancellationReason")) await queryRunner.dropColumn("appointments", "cancellationReason");
            if (appointmentTable.columns.find(c => c.name === "appointmentCompletionReport")) await queryRunner.dropColumn("appointments", "appointmentCompletionReport");
            if (appointmentTable.columns.find(c => c.name === "clinicNotes")) await queryRunner.dropColumn("appointments", "clinicNotes");
            if (appointmentTable.columns.find(c => c.name === "followUpServiceId")) await queryRunner.dropColumn("appointments", "followUpServiceId");
            if (appointmentTable.columns.find(c => c.name === "serviceExecuted")) await queryRunner.dropColumn("appointments", "serviceExecuted");
            if (appointmentTable.columns.find(c => c.name === "showStatus")) await queryRunner.dropColumn("appointments", "showStatus");
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
