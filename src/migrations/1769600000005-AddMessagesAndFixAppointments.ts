import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class AddMessagesAndFixAppointments1769600000005 implements MigrationInterface {
    name = 'AddMessagesAndFixAppointments1769600000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create conversations table
        const hasConversations = await queryRunner.hasTable("conversations");
        if (!hasConversations) {
            await queryRunner.createTable(new Table({
                name: "conversations",
                columns: [
                    { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                    { name: "title", type: "varchar", isNullable: true },
                    { name: "isGroup", type: "boolean", default: false },
                    { name: "lastMessageId", type: "uuid", isNullable: true },
                    { name: "createdAt", type: "timestamp", default: "now()" },
                    { name: "updatedAt", type: "timestamp", default: "now()" }
                ]
            }), true);
        }

        // 2. Create messages table
        const hasMessages = await queryRunner.hasTable("messages");
        if (!hasMessages) {
            await queryRunner.createTable(new Table({
                name: "messages",
                columns: [
                    { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                    { name: "conversationId", type: "uuid", isNullable: false },
                    { name: "senderId", type: "uuid", isNullable: false },
                    { name: "content", type: "text", isNullable: false },
                    { name: "type", type: "varchar", default: "'text'" },
                    { name: "metadata", type: "jsonb", isNullable: true },
                    { name: "createdAt", type: "timestamp", default: "now()" }
                ]
            }), true);

            await queryRunner.createForeignKey("messages", new TableForeignKey({
                columnNames: ["conversationId"],
                referencedColumnNames: ["id"],
                referencedTableName: "conversations",
                onDelete: "CASCADE"
            }));

            await queryRunner.createForeignKey("messages", new TableForeignKey({
                columnNames: ["senderId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            }));
        }

        // 3. Create conversation_participants table
        const hasParticipants = await queryRunner.hasTable("conversation_participants");
        if (!hasParticipants) {
            await queryRunner.createTable(new Table({
                name: "conversation_participants",
                columns: [
                    { name: "conversationId", type: "uuid", isPrimary: true },
                    { name: "userId", type: "uuid", isPrimary: true },
                    { name: "joinedAt", type: "timestamptz", default: "now()" },
                    { name: "lastReadAt", type: "timestamptz", isNullable: true }
                ]
            }), true);

            await queryRunner.createForeignKey("conversation_participants", new TableForeignKey({
                columnNames: ["conversationId"],
                referencedColumnNames: ["id"],
                referencedTableName: "conversations",
                onDelete: "CASCADE"
            }));

            await queryRunner.createForeignKey("conversation_participants", new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            }));
        }

        // 4. Update appointments table with missing columns
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            if (!appointmentTable.columns.find(c => c.name === "amountPaid")) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "amountPaid",
                    type: "numeric",
                    precision: 10,
                    scale: 2,
                    isNullable: true,
                    default: 0
                }));
            }
            if (!appointmentTable.columns.find(c => c.name === "cancelledAt")) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "cancelledAt",
                    type: "timestamptz",
                    isNullable: true
                }));
            }
            if (!appointmentTable.columns.find(c => c.name === "noShowMarkedAt")) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "noShowMarkedAt",
                    type: "timestamptz",
                    isNullable: true
                }));
            }
            if (!appointmentTable.columns.find(c => c.name === "bookedById")) {
                await queryRunner.addColumn("appointments", new TableColumn({
                    name: "bookedById",
                    type: "uuid",
                    isNullable: true
                }));

                await queryRunner.createForeignKey("appointments", new TableForeignKey({
                    columnNames: ["bookedById"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const appointmentTable = await queryRunner.getTable("appointments");
        if (appointmentTable) {
            if (appointmentTable.columns.find(c => c.name === "bookedById")) {
                const table = await queryRunner.getTable("appointments");
                const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("bookedById") !== -1);
                if (foreignKey) await queryRunner.dropForeignKey("appointments", foreignKey);
                await queryRunner.dropColumn("appointments", "bookedById");
            }
            if (appointmentTable.columns.find(c => c.name === "noShowMarkedAt")) await queryRunner.dropColumn("appointments", "noShowMarkedAt");
            if (appointmentTable.columns.find(c => c.name === "cancelledAt")) await queryRunner.dropColumn("appointments", "cancelledAt");
            if (appointmentTable.columns.find(c => c.name === "amountPaid")) await queryRunner.dropColumn("appointments", "amountPaid");
        }

        await queryRunner.dropTable("conversation_participants");
        await queryRunner.dropTable("messages");
        await queryRunner.dropTable("conversations");
    }
}
