import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../bookings/entities/appointment.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { VivaWalletService } from './viva-wallet.service';

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
        private vivaWalletService: VivaWalletService,
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
                    const appointmentId = verified.merchantTrns;
                    await this.appointmentsRepository.update(appointmentId, {
                        status: AppointmentStatus.CONFIRMED,
                        paymentMethod: 'card',
                        // The amount is in cents from Viva, convert to your currency
                        amountPaid: verified.amount / 100,
                    });
                    console.log(`[Viva Wallet] Appointment ${appointmentId} confirmed after payment.`);
                    // Redirect to the frontend confirmation page
                    return { redirectUrl: `/booking-confirmation?appointmentId=${appointmentId}&paid=true` };
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
                await this.appointmentsRepository.update(merchantTrns, {
                    status: AppointmentStatus.CONFIRMED,
                    paymentMethod: 'card',
                    amountPaid: amount ? amount / 100 : undefined,
                });
                console.log(`[Viva Wallet] Appointment ${merchantTrns} confirmed via webhook. TransactionId: ${transactionId}`);
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
