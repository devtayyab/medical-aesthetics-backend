import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../bookings/entities/appointment.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { VivaWalletService } from './viva-wallet.service';
import { FinancialService } from './financial.service';
import { PaymentMethod, PaymentType, PaymentStatus } from './entities/payment-record.entity';
import { GiftCard } from '../clinics/entities/gift-card.entity';

/**
 * Viva Wallet Webhook & Redirect Handler
 *
 * Viva Wallet calls these endpoints after a payment:
 *   GET /api/payments/viva/success?t={transactionId}&s={orderCode}&lang={lang}&eventId={eventId}&eci={eci}
 *   GET /api/payments/viva/failure?t={transactionId}&s={orderCode}&lang={lang}&eventId={eventId}
 *
 * You must configure these in your Viva Wallet merchant portal:
 *   - Success URL: https://YOUR_DOMAIN/api/payments/viva/success
 *   - Failure URL: https://YOUR_DOMAIN/api/payments/viva/failure
 *
 * Webhook (IPN) for server-to-server verification:
 *   POST /api/payments/viva/webhook
 */
@ApiTags('Payments')
@Controller('payments/viva')
export class VivaWalletController {
    constructor(
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        @InjectRepository(GiftCard)
        private giftCardRepository: Repository<GiftCard>,
        @InjectRepository(Clinic)
        private clinicsRepository: Repository<Clinic>,
        private vivaWalletService: VivaWalletService,
        private financialService: FinancialService,
    ) { }

    /**
     * Viva Wallet calls this URL after a SUCCESSFUL payment.
     * We verify the transaction and mark the appointment as CONFIRMED.
     */
    @Public()
    @Get('success')
    @ApiOperation({ summary: 'Viva Wallet payment success redirect' })
    async handleSuccess(@Query() query: { t?: string; s?: string; merchantTrns?: string }) {
        const orderCode = query.s;
        const transactionId = query.t;

        console.log('[Viva Wallet] SUCCESS callback received:', { orderCode, transactionId, query });

        if (transactionId) {
            try {
                const result = await this.processVerifiedPayment(transactionId, 'redirect');
                if (result?.kind === 'appointment') {
                    return { redirectUrl: `/booking-confirmation?appointmentId=${result.id}&paid=true` };
                }
                if (result?.kind === 'giftCard') {
                    return { redirectUrl: `/account/gift-cards?success=true&code=${result.code}` };
                }
            } catch (err) {
                console.error('[Viva Wallet] Transaction verification failed:', err?.message);
            }
        }

        // Fallback redirect to frontend
        return { message: 'Payment received. Appointment will be confirmed shortly.' };
    }

    /**
     * Single path for applying a Viva payment (used by the success redirect AND the webhook).
     *
     * - The transaction is re-fetched from Viva server-to-server; nothing from the caller is trusted.
     * - Only a successful (statusId 'F') EUR payment is applied. A declined/cancelled/refunded
     *   transaction id must never confirm an appointment or trigger a clinic payout.
     * - Viva's Retrieve Transaction API returns `amount` in EUR (e.g. 30.00), NOT in cents.
     * - A Postgres advisory lock per transaction id serialises the redirect and the webhook
     *   (which arrive almost simultaneously), so a payment is recorded and paid out once.
     */
    private async processVerifiedPayment(
        transactionId: string,
        source: 'redirect' | 'webhook',
    ): Promise<{ kind: 'appointment'; id: string } | { kind: 'giftCard'; code: string } | null> {
        const verified = await this.vivaWalletService.verifyTransaction(transactionId);
        if (!verified) return null;

        if (verified.statusId !== 'F') {
            console.warn(`[Viva Wallet] Transaction ${transactionId} not successful (statusId=${verified.statusId}). Ignored.`);
            return null;
        }
        if (verified.currencyCode && String(verified.currencyCode) !== '978') {
            console.warn(`[Viva Wallet] Transaction ${transactionId} is not in EUR (currencyCode=${verified.currencyCode}). Ignored.`);
            return null;
        }
        const amount = Math.round(Number(verified.amount) * 100) / 100;
        if (!Number.isFinite(amount) || amount <= 0) {
            console.warn(`[Viva Wallet] Transaction ${transactionId} has invalid amount ${verified.amount}. Ignored.`);
            return null;
        }

        const merchantTrns = verified.merchantTrns;
        if (!merchantTrns) return null;
        const suffix = source === 'webhook' ? ' (Webhook)' : '';

        return this.withTransactionLock(transactionId, async () => {
            // Idempotency: the success redirect AND the webhook both fire for the same
            // payment (and Viva retries). If we already recorded this transaction, stop
            // so we never double-record or double-payout.
            const alreadyProcessed = await this.financialService.findByTransactionReference(transactionId);
            if (alreadyProcessed) {
                if (alreadyProcessed.appointmentId) return { kind: 'appointment' as const, id: alreadyProcessed.appointmentId };
                const code = alreadyProcessed.metadata?.giftCardCode;
                return code ? { kind: 'giftCard' as const, code } : null;
            }

            // Try Appointment
            const appointment = await this.appointmentsRepository.findOne({ where: { id: merchantTrns } });
            if (appointment) {
                const isCompleted = ['COMPLETED', 'EXECUTED'].includes(String(appointment.status || '').toUpperCase());
                // NOTE: do not set amountPaid here — recordPayment() is the single source of
                // truth and increments amountPaid, otherwise the amount is counted twice.
                if (!isCompleted) {
                    await this.appointmentsRepository.update(merchantTrns, {
                        status: AppointmentStatus.CONFIRMED,
                        paymentMethod: PaymentMethod.VIVA_WALLET,
                    });
                }

                await this.financialService.recordPayment({
                    appointmentId: merchantTrns,
                    clinicId: appointment.clinicId,
                    clientId: appointment.clientId,
                    providerId: appointment.providerId,
                    amount,
                    method: PaymentMethod.VIVA_WALLET,
                    type: PaymentType.PAYMENT,
                    status: PaymentStatus.COMPLETED,
                    transactionReference: transactionId,
                    notes: `Paid online via Viva Wallet${suffix}`,
                });
                console.log(`[Viva Wallet] Appointment ${merchantTrns} confirmed after payment${suffix}. TransactionId: ${transactionId}`);

                // ─── AUTO PAYOUT TO CLINIC IBAN ──────────────────────────────
                if (appointment.clinicId) {
                    const clinic = await this.clinicsRepository.createQueryBuilder('clinic')
                        .addSelect(['clinic.bankIban', 'clinic.bankBic', 'clinic.bankAccountHolder', 'clinic.bankName'])
                        .where('clinic.id = :id', { id: appointment.clinicId })
                        .getOne();
                    if (clinic?.bankIban) {
                        console.log(`[Viva Payout] Initiating payout to clinic ${clinic.id}, amount: ${amount}`);
                        const payout = await this.vivaWalletService.sendPayoutToIban({
                            amount,
                            iban: clinic.bankIban,
                            fullName: clinic.bankAccountHolder || clinic.name,
                            reference: merchantTrns,
                        });
                        if (payout.success) {
                            console.log(`[Viva Payout] ✅ Payout sent to clinic ${clinic.name}. TxId: ${payout.transactionId}`);
                        } else {
                            console.warn(`[Viva Payout] ⚠️ Payout failed for clinic ${clinic.name}: ${payout.error}`);
                        }
                    } else {
                        console.warn(`[Viva Payout] ⚠️ Clinic ${appointment.clinicId} has no IBAN set. Payout skipped.`);
                    }
                }
                // ─────────────────────────────────────────────────────────────

                return { kind: 'appointment' as const, id: merchantTrns };
            }

            // Try Gift Card
            const giftCard = await this.giftCardRepository.findOne({ where: { id: merchantTrns } });
            if (giftCard && !giftCard.isActive && !giftCard.redeemedAt) {
                // The card's face value was fixed when the order was created; never activate a
                // card for less money than it is worth.
                if (amount + 0.005 < Number(giftCard.amount)) {
                    console.warn(`[Viva Wallet] Gift card ${merchantTrns} paid ${amount} < face value ${giftCard.amount}. Not activated.`);
                    return null;
                }
                giftCard.isActive = true;
                await this.giftCardRepository.save(giftCard);

                await this.financialService.recordPayment({
                    clinicId: null, // Platform payment
                    clientId: giftCard.userId,
                    amount,
                    method: PaymentMethod.VIVA_WALLET,
                    type: PaymentType.PAYMENT,
                    status: PaymentStatus.COMPLETED,
                    transactionReference: transactionId,
                    notes: `Gift Card Purchase via Viva Wallet${suffix}: Code ${giftCard.code}`,
                    metadata: { giftCardCode: giftCard.code },
                });

                console.log(`[Viva Wallet] Gift Card ${merchantTrns} activated after payment${suffix}. TransactionId: ${transactionId}`);
                return { kind: 'giftCard' as const, code: giftCard.code };
            }

            return null;
        });
    }

    /** Cross-instance mutex keyed on a Viva transaction id (Postgres session advisory lock). */
    private async withTransactionLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
        const queryRunner = this.appointmentsRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.query('SELECT pg_advisory_lock(hashtext($1))', [`viva:${key}`]);
            try {
                return await fn();
            } finally {
                await queryRunner.query('SELECT pg_advisory_unlock(hashtext($1))', [`viva:${key}`]);
            }
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Viva Wallet calls this URL after a FAILED or CANCELLED payment.
     */
    @Public()
    @Get('failure')
    @ApiOperation({ summary: 'Viva Wallet payment failure redirect' })
    async handleFailure(@Query() query: { t?: string; s?: string }) {
        console.log('[Viva Wallet] FAILURE callback received:', query);
        return { message: 'Payment was not completed. Your appointment is still reserved for a short time.' };
    }

    /**
     * Viva Wallet IPN (Instant Payment Notification) Webhook.
     * This is server-to-server and more reliable than the redirect callbacks.
     * Register this in Viva Wallet portal -> Webhooks.
     */
    @Public()
    @Post('webhook')
    @ApiOperation({ summary: 'Viva Wallet IPN webhook' })
    async handleWebhook(@Body() body: any) {
        console.log('[Viva Wallet] Webhook received:', JSON.stringify(body));

        const eventType = body?.EventTypeId;

        // EventTypeId 1796 = Transaction Payment Created (successful payment)
        if (eventType === 1796) {
            const transactionId = body?.EventData?.TransactionId;

            // SECURITY: never trust the webhook body. processVerifiedPayment re-verifies the
            // transaction server-to-server against Viva's API and uses ITS authoritative
            // status/amount/merchantTrns. A forged webhook with a bogus TransactionId is ignored.
            if (!transactionId) return { received: true };
            await this.processVerifiedPayment(transactionId, 'webhook');
        }

        // EventTypeId 1797 = Transaction Reversal Created (refund)
        if (eventType === 1797) {
            // SECURITY: this endpoint is public, so the body is untrusted. Locate the original
            // payment we recorded (by Viva's ParentId, falling back to MerchantTrns), then ask
            // Viva whether that original transaction really is refunded before reversing it.
            // Otherwise anyone could cancel any appointment and wipe its revenue.
            const parentId = body?.EventData?.ParentId;
            const merchantTrns = body?.EventData?.MerchantTrns;
            let original = parentId ? await this.financialService.findByTransactionReference(parentId) : null;
            if (!original && merchantTrns) {
                original = await this.financialService.findCompletedPaymentByAppointment(merchantTrns);
            }
            if (
                !original ||
                original.method !== PaymentMethod.VIVA_WALLET ||
                original.type !== PaymentType.PAYMENT ||
                original.status !== PaymentStatus.COMPLETED ||
                !original.transactionReference
            ) {
                return { received: true };
            }

            const viva = await this.vivaWalletService.verifyTransaction(original.transactionReference);
            if (!viva || !['R', 'ML'].includes(String(viva.statusId))) {
                console.warn(`[Viva Wallet] Reversal for ${original.transactionReference} not confirmed by Viva (statusId=${viva?.statusId}). Ignored.`);
                return { received: true };
            }

            // Reverse the original payment so revenue/turnover and amountPaid are corrected,
            // not just the appointment status.
            try {
                await this.financialService.refundPayment(original.id, 'Viva Wallet transaction reversed');
            } catch (err) {
                console.error('[Viva Wallet] Failed to record refund on reversal:', err?.message);
            }
            if (original.appointmentId) {
                await this.appointmentsRepository.update(original.appointmentId, {
                    status: AppointmentStatus.CANCELLED,
                });
                console.log(`[Viva Wallet] Appointment ${original.appointmentId} cancelled due to refund.`);
            }
        }

        return { received: true };
    }
}
