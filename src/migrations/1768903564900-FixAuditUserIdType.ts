import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuditUserIdType1768903564900 implements MigrationInterface {
    name = 'FixAuditUserIdType1768903564900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change userId from varchar to uuid with explicit casting
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid`);
        
        // Add foreign key constraint as well for data integrity
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "userId" TYPE character varying`);
    }
}
