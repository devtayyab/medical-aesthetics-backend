import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSalesTargetToUser1773035140193 implements MigrationInterface {
    name = 'AddSalesTargetToUser1773035140193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Helper function to check if column exists
        const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
            const result = await queryRunner.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = '${tableName}'
                    AND column_name = '${columnName}'
                )`
            );
            return result[0].exists;
        };

        if (!(await columnExists('users', 'monthlyTarget'))) {
            await queryRunner.query(`ALTER TABLE "users" ADD "monthlyTarget" numeric(10,2)`);
        }
        
        if (!(await columnExists('users', 'assignedClinicId'))) {
             await queryRunner.query(`ALTER TABLE "users" ADD "assignedClinicId" uuid`);
             await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_assigned_clinic" FOREIGN KEY ("assignedClinicId") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_assigned_clinic"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "assignedClinicId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "monthlyTarget"`);
    }
}

