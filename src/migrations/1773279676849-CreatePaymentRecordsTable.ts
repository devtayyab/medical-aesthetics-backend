import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePaymentRecordsTable1773279676849 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Enums if they don't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_records_method_enum') THEN
                    CREATE TYPE "payment_records_method_enum" AS ENUM('cash', 'pos', 'viva_wallet', 'online_deposit', 'gift_card');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_records_type_enum') THEN
                    CREATE TYPE "payment_records_type_enum" AS ENUM('payment', 'refund', 'deposit', 'void');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_records_status_enum') THEN
                    CREATE TYPE "payment_records_status_enum" AS ENUM('completed', 'pending', 'failed', 'refunded', 'voided');
                END IF;
            END $$;
        `);

        // 2. Create payment_records table
        const tableExists = await queryRunner.hasTable("payment_records");
        if (!tableExists) {
            await queryRunner.createTable(new Table({
                name: "payment_records",
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
                        name: "appointmentId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "clinicId",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "clientId",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "providerId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "salespersonId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "amount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "currency",
                        type: "varchar",
                        default: "'EUR'"
                    },
                    {
                        name: "method",
                        type: "enum",
                        enumName: "payment_records_method_enum",
                        isNullable: false
                    },
                    {
                        name: "type",
                        type: "enum",
                        enumName: "payment_records_type_enum",
                        default: "'payment'",
                        isNullable: false
                    },
                    {
                        name: "status",
                        type: "enum",
                        enumName: "payment_records_status_enum",
                        default: "'completed'",
                        isNullable: false
                    },
                    {
                        name: "transactionReference",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "metadata",
                        type: "json",
                        isNullable: true
                    },
                    {
                        name: "recordedById",
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

            // 3. Add Foreign Keys
            await queryRunner.createForeignKeys("payment_records", [
                new TableForeignKey({
                    columnNames: ["appointmentId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "appointments",
                    onDelete: "SET NULL"
                }),
                new TableForeignKey({
                    columnNames: ["clinicId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "clinics",
                    onDelete: "NO ACTION"
                }),
                new TableForeignKey({
                    columnNames: ["clientId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "NO ACTION"
                }),
                new TableForeignKey({
                    columnNames: ["providerId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                }),
                new TableForeignKey({
                    columnNames: ["salespersonId"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                }),
                new TableForeignKey({
                    columnNames: ["recordedById"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "users",
                    onDelete: "SET NULL"
                })
            ]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (await queryRunner.hasTable("payment_records")) {
            await queryRunner.dropTable("payment_records");
        }
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_records_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_records_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_records_method_enum"`);
    }

}
