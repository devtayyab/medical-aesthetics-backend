import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProviderIdNullable1739420000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "providerId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "providerId" SET NOT NULL`);
    }

}
