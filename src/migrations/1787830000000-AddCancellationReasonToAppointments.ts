import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * QA Y33: the cancellation reason is shown to the client on the cancelled appointment card.
 * It gets its own column so internal staff notes never have to reach the client.
 */
export class AddCancellationReasonToAppointments1787830000000 implements MigrationInterface {
    name = 'AddCancellationReasonToAppointments1787830000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancellationReason" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "cancellationReason"`);
    }
}
