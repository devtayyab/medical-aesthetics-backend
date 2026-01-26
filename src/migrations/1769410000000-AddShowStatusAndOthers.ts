import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddShowStatusAndOthers1769410000000 implements MigrationInterface {
    name = 'AddShowStatusAndOthers1769410000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            const hasShowStatusColumn = appointmentTable.columns.find(column => column.name === "showStatus");
            if (!hasShowStatusColumn) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "showStatus",
                    type: "boolean",
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
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            if (appointmentTable.columns.find(c => c.name === "cancellationReason")) await queryRunner.dropColumn("appointments", "cancellationReason");
            if (appointmentTable.columns.find(c => c.name === "appointmentCompletionReport")) await queryRunner.dropColumn("appointments", "appointmentCompletionReport");
            if (appointmentTable.columns.find(c => c.name === "clinicNotes")) await queryRunner.dropColumn("appointments", "clinicNotes");
            if (appointmentTable.columns.find(c => c.name === "followUpServiceId")) await queryRunner.dropColumn("appointments", "followUpServiceId");
            if (appointmentTable.columns.find(c => c.name === "serviceExecuted")) await queryRunner.dropColumn("appointments", "serviceExecuted");
            if (appointmentTable.columns.find(c => c.name === "showStatus")) await queryRunner.dropColumn("appointments", "showStatus");
        }
    }
}
