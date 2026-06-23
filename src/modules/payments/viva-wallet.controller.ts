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

        // The merchantTrns we passed is the appointment ID
        // Try to verify the transaction and find the appointment
        if (transactionId) {
            try {
                const verified = await this.vivaWalletService.verifyTransaction(transactionId);
                if (verified) {
                    const merchantTrns = verified.merchantTrns;
                    
                    // Try Appointment
                    const appointment = await this.appointmentsRepository.findOne({ where: { id: merchantTrns }});
                    if (appointment) {
                        await this.appointmentsRepository.update(merchantTrns, {
                            status: AppointmentStatus.CONFIRMED,
                            paymentMethod: 'card',
                            amountPaid: verified.amount / 100,
                        });
                        
                        await this.financialService.recordPayment({
                            appointmentId: merchantTrns,
                            clinicId: appointment.clinicId,
                            clientId: appointment.clientId,
                            providerId: appointment.providerId,
                            amount: verified.amount / 100,
                            method: PaymentMethod.VIVA_WALLET,
                            type: PaymentType.PAYMENT,
                            status: PaymentStatus.COMPLETED,
                            transactionReference: transactionId,
                            notes: 'Paid online via Viva Wallet',
                        });
                        console.log(`[Viva Wallet] Appointment ${merchantTrns} confirmed after payment.`);

                        // ─── AUTO PAYOUT TO CLINIC IBAN ──────────────────────────────
                        if (appointment.clinicId) {
                            const clinic = await this.clinicsRepository.findOne({
                                where: { id: appointment.clinicId }
                            });
                            if (clinic?.bankIban) {
                                console.log(`[Viva Payout] Clinic has IBAN. Initiating payout to: ${clinic.bankIban}`);
                                const payout = await this.vivaWalletService.sendPayoutToIban({
                                    amount: verified.amount / 100,
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

                        return { redirectUrl: `/booking-confirmation?appointmentId=${merchantTrns}&paid=true` };
                    }

                    // Try Gift Card
                    const giftCard = await this.giftCardRepository.findOne({ where: { id: merchantTrns }});
                    if (giftCard) {
                        giftCard.isActive = true;
                        await this.giftCardRepository.save(giftCard);

                        await this.financialService.recordPayment({
                            clinicId: null, // Platform payment
                            clientId: giftCard.userId,
                            amount: verified.amount / 100,
                            method: PaymentMethod.VIVA_WALLET,
                            type: PaymentType.PAYMENT,
                            status: PaymentStatus.COMPLETED,
                            transactionReference: transactionId,
                            notes: `Gift Card Purchase via Viva Wallet: Code ${giftCard.code}`,
                            metadata: { giftCardCode: giftCard.code },
                        });

                        console.log(`[Viva Wallet] Gift Card ${merchantTrns} activated after payment.`);
                        return { redirectUrl: `/account/gift-cards?success=true&code=${giftCard.code}` };
                    }
                }
            } catch (err) {
                console.error('[Viva Wallet] Transaction verification failed:', err?.message);
            }
        }

        // Fallback redirect to frontend
        return { message: 'Payment received. Appointment will be confirmed shortly.' };
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
            const merchantTrns = body?.EventData?.MerchantTrns; // This is our appointmentId
            const amount = body?.EventData?.Amount; // in cents

            if (merchantTrns) {
                // Try Appointment
                const appointment = await this.appointmentsRepository.findOne({ where: { id: merchantTrns }});
                if (appointment) {
                    await this.appointmentsRepository.update(merchantTrns, {
                        status: AppointmentStatus.CONFIRMED,
                        paymentMethod: 'card',
                        amountPaid: amount ? amount / 100 : undefined,
                    });
                    
                    await this.financialService.recordPayment({
                        appointmentId: merchantTrns,
                        clinicId: appointment.clinicId,
                        clientId: appointment.clientId,
                        providerId: appointment.providerId,
                        amount: amount ? amount / 100 : 0,
                        method: PaymentMethod.VIVA_WALLET,
                        type: PaymentType.PAYMENT,
                        status: PaymentStatus.COMPLETED,
                        transactionReference: transactionId,
                        notes: 'Paid online via Viva Wallet (Webhook)',
                    });
                    console.log(`[Viva Wallet] Appointment ${merchantTrns} confirmed via webhook. TransactionId: ${transactionId}`);

                    // ─── AUTO PAYOUT TO CLINIC IBAN (Webhook) ────────────────────
                    if (appointment.clinicId) {
                        const clinic = await this.clinicsRepository.findOne({
                            where: { id: appointment.clinicId }
                        });
                        if (clinic?.bankIban) {
                            const payoutAmount = amount ? amount / 100 : 0;
                            console.log(`[Viva Payout] Webhook: Initiating payout to clinic IBAN: ${clinic.bankIban}, amount: ${payoutAmount}`);
                            const payout = await this.vivaWalletService.sendPayoutToIban({
                                amount: payoutAmount,
                                iban: clinic.bankIban,
                                fullName: clinic.bankAccountHolder || clinic.name,
                                reference: merchantTrns,
                            });
                            if (payout.success) {
                                console.log(`[Viva Payout] ✅ Webhook payout sent to clinic ${clinic.name}. TxId: ${payout.transactionId}`);
                            } else {
                                console.warn(`[Viva Payout] ⚠️ Webhook payout failed: ${payout.error}`);
                            }
                        } else {
                            console.warn(`[Viva Payout] ⚠️ Clinic ${appointment.clinicId} has no IBAN set. Payout skipped.`);
                        }
                    }
                    // ────────────────────────────────────────────────────────────
                }

                // Try Gift Card
                const giftCard = await this.giftCardRepository.findOne({ where: { id: merchantTrns }});
                if (giftCard && !giftCard.isActive) {
                    giftCard.isActive = true;
                    await this.giftCardRepository.save(giftCard);

                    await this.financialService.recordPayment({
                        clinicId: null, // Platform payment
                        clientId: giftCard.userId,
                        amount: amount ? amount / 100 : 0,
                        method: PaymentMethod.VIVA_WALLET,
                        type: PaymentType.PAYMENT,
                        status: PaymentStatus.COMPLETED,
                        transactionReference: transactionId,
                        notes: `Gift Card Purchase via Viva Wallet (Webhook): Code ${giftCard.code}`,
                        metadata: { giftCardCode: giftCard.code },
                    });

                    console.log(`[Viva Wallet] Gift Card ${merchantTrns} activated via webhook. TransactionId: ${transactionId}`);
                }
            }
        }

        // EventTypeId 1797 = Transaction Reversed (refund)
        if (eventType === 1797) {
            const merchantTrns = body?.EventData?.MerchantTrns;
            if (merchantTrns) {
                await this.appointmentsRepository.update(merchantTrns, {
                    status: AppointmentStatus.CANCELLED,
                });
                console.log(`[Viva Wallet] Appointment ${merchantTrns} cancelled due to refund.`);
            }
        }

        return { received: true };
    }
}
