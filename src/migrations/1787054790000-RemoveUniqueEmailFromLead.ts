import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUniqueEmailFromLead1787054790000 implements MigrationInterface {
    name = 'RemoveUniqueEmailFromLead1787054790000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Find the unique constraint name for the email column in the leads table
        const result = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'leads' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name IN (
                SELECT constraint_name 
                FROM information_schema.constraint_column_usage 
                WHERE table_name = 'leads' AND column_name = 'email'
            );
        `);
        
        if (result && result.length > 0) {
            const constraintName = result[0].constraint_name;
            await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "${constraintName}"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "UQ_leads_email" UNIQUE ("email")`);
    }
}
