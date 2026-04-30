import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentMethodEnum1777542510756 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "payment_records_method_enum" ADD VALUE IF NOT EXISTS 'card'`);
        await queryRunner.query(`ALTER TYPE "payment_records_method_enum" ADD VALUE IF NOT EXISTS 'bank_transfer'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Enums values cannot be easily removed in Postgres without recreating the type.
        // We leave it as is for down migration to avoid data loss or complexity.
    }

}
