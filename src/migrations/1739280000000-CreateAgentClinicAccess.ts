import { MigrationInterface, QueryRunner, Table, TableUnique, TableIndex, TableForeignKey } from "typeorm";

export class CreateAgentClinicAccess1739280000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create table
        await queryRunner.createTable(new Table({
            name: "agent_clinic_access",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "uuid_generate_v4()",
                },
                {
                    name: "agentUserId",
                    type: "uuid",
                },
                {
                    name: "clinicId",
                    type: "uuid",
                },
            ],
        }), true);

        // Create Unique Constraint
        await queryRunner.createUniqueConstraint("agent_clinic_access", new TableUnique({
            columnNames: ["agentUserId", "clinicId"],
        }));

        // Create Indexes
        await queryRunner.createIndex("agent_clinic_access", new TableIndex({
            columnNames: ["agentUserId"],
        }));

        await queryRunner.createIndex("agent_clinic_access", new TableIndex({
            columnNames: ["clinicId"],
        }));

        // Create Foreign Keys
        await queryRunner.createForeignKey("agent_clinic_access", new TableForeignKey({
            columnNames: ["agentUserId"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE",
        }));

        await queryRunner.createForeignKey("agent_clinic_access", new TableForeignKey({
            columnNames: ["clinicId"],
            referencedColumnNames: ["id"],
            referencedTableName: "clinics",
            onDelete: "CASCADE",
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("agent_clinic_access");
        const foreignKeyUser = table.foreignKeys.find(fk => fk.columnNames.indexOf("agentUserId") !== -1);
        const foreignKeyClinic = table.foreignKeys.find(fk => fk.columnNames.indexOf("clinicId") !== -1);
        await queryRunner.dropForeignKey("agent_clinic_access", foreignKeyUser);
        await queryRunner.dropForeignKey("agent_clinic_access", foreignKeyClinic);
        await queryRunner.dropTable("agent_clinic_access");
    }
}
