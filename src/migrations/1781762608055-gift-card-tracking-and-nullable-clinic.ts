import { MigrationInterface, QueryRunner } from "typeorm";

export class GiftCardTrackingAndNullableClinic1781762608055 implements MigrationInterface {
    name = 'GiftCardTrackingAndNullableClinic1781762608055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Appointments
        await queryRunner.query(`ALTER TABLE "appointments" ADD "giftCardId" uuid`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "giftCardAmountRedeemed" numeric(10,2)`);
        
        // Gift Cards
        await queryRunner.query(`ALTER TABLE "gift_cards" ADD "redeemedByUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "gift_cards" ADD "redeemedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "gift_cards" ADD "redeemedAppointmentId" uuid`);

        // Payment Records
        await queryRunner.query(`ALTER TABLE "payment_records" ALTER COLUMN "clinicId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_records" ALTER COLUMN "clinicId" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "gift_cards" DROP COLUMN "redeemedAppointmentId"`);
        await queryRunner.query(`ALTER TABLE "gift_cards" DROP COLUMN "redeemedAt"`);
        await queryRunner.query(`ALTER TABLE "gift_cards" DROP COLUMN "redeemedByUserId"`);
        
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "giftCardAmountRedeemed"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "giftCardId"`);
    }
}
