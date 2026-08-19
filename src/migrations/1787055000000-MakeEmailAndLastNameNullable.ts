import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeEmailAndLastNameNullable1787055000000 implements MigrationInterface {
    name = 'MakeEmailAndLastNameNullable1787055000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "lastName" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "lastName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "email" SET NOT NULL`);
    }
}
