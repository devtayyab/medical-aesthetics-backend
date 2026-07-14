import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterShowStatusToVarchar1784013841527 implements MigrationInterface {
    name = 'AlterShowStatusToVarchar1784013841527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const result = await queryRunner.query(`
            SELECT data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'showStatus';
        `);
        
        if (result.length > 0) {
            const dataType = result[0].data_type;
            const udtName = result[0].udt_name;
            
            if (dataType === 'boolean') {
                await queryRunner.query(`
                    ALTER TABLE "appointments" 
                    ALTER COLUMN "showStatus" TYPE varchar(50) 
                    USING CASE 
                        WHEN "showStatus" = true THEN 'showed_up' 
                        WHEN "showStatus" = false THEN 'no_show' 
                        ELSE 'pending' 
                    END;
                `);
            } else if (dataType === 'USER-DEFINED' && udtName === 'appointments_showstatus_enum') {
                await queryRunner.query(`
                    ALTER TABLE "appointments" 
                    ALTER COLUMN "showStatus" TYPE varchar(50) 
                    USING "showStatus"::text;
                `);
            } else if (dataType !== 'character varying') {
                await queryRunner.query(`
                    ALTER TABLE "appointments" 
                    ALTER COLUMN "showStatus" TYPE varchar(50) 
                    USING "showStatus"::text;
                `);
            }
        } else {
             await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN "showStatus" VARCHAR(50)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
