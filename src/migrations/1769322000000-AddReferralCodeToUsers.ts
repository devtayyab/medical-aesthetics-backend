import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferralCodeToUsers1769322000000 implements MigrationInterface {
    name = 'AddReferralCodeToUsers1769322000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if referralCode column exists, add it if it doesn't
        const columnExists = await queryRunner.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'users' 
              AND column_name = 'referralCode'
            )`
        );
        
        if (!columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "referralCode" character varying`);
            
            // Check if the unique constraint exists before adding it
            const constraintExists = await queryRunner.query(
                `SELECT EXISTS (
                  SELECT FROM information_schema.table_constraints 
                  WHERE constraint_name = 'UQ_b7f8278f4e89249bb75c9a15899'
                )`
            );
            
            if (!constraintExists[0].exists) {
                await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899" UNIQUE ("referralCode")`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_b7f8278f4e89249bb75c9a15899"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referralCode"`);
    }
}
