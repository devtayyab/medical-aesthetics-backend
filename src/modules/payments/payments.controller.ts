import { Controller, Get, Post, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { VivaWalletService } from './viva-wallet.service';
import { stripUserPersonalData, stripClinicBankData } from '../../common/utils/privacy.util';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
    constructor(
        private readonly financialService: FinancialService,
        private readonly vivaWalletService: VivaWalletService,
    ) { }

    @Get('my-wallet')
    @Roles(UserRole.CLIENT)
    @ApiOperation({ summary: 'Get payment history for the current client' })
    async getMyWallet(@Req() req: any, @Query('limit') limit?: number, @Query('offset') offset?: number) {
        const ledger = await this.financialService.getLedger({
            clientId: req.user.id,
            limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
            offset: Math.max(Number(offset) || 0, 0),
        });
        // Client view: no staff contact details, no internal notes, no clinic bank details
        return {
            ...ledger,
            items: ledger.items.map((p: any) => ({
                ...p,
                provider: stripUserPersonalData(p.provider),
                salesperson: stripUserPersonalData(p.salesperson),
                clinic: stripClinicBankData(p.clinic),
                appointment: p.appointment
                    ? (({ notes, clinicNotes, appointmentCompletionReport, ...rest }) => rest)(p.appointment)
                    : p.appointment,
            })),
        };
    }

    @Get('gift-cards')
    @Roles(UserRole.CLIENT)
    @ApiOperation({ summary: 'Get gift cards for the current client' })
    async getMyGiftCards(@Req() req: any) {
        return this.financialService.getMyGiftCards(req.user.id);
    }

    @Post('gift-cards')
    @Roles(UserRole.CLIENT)
    @ApiOperation({ summary: 'Purchase a new gift card via Viva Wallet' })
    async purchaseGiftCard(@Req() req: any, @Body() body: { amount: number; recipientEmail?: string; message?: string }) {
        // The face value is client-chosen (the client pays it), but it must be a sane EUR amount.
        const amount = Number(body?.amount);
        if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
            throw new BadRequestException('Gift card amount must be between €1 and €10,000');
        }
        body = { ...body, amount: Math.round(amount * 100) / 100 };
        const giftCard = await this.financialService.purchaseGiftCard(req.user.id, body);
        
        // Generate Viva Wallet checkout link
        const redirectUrl = await this.vivaWalletService.createPaymentOrder({
            amount: giftCard.amount,
            customerEmail: req.user.email,
            customerPhone: req.user.phone,
            customerName: `${req.user.firstName} ${req.user.lastName}`,
            merchantTrns: giftCard.id, // Use Gift Card ID as the transaction reference
        });

        return { redirectUrl };
    }

    @Post('gift-cards/apply')
    @Roles(UserRole.CLIENT)
    @ApiOperation({ summary: 'Validate a gift card for checkout' })
    async applyGiftCard(@Req() req: any, @Body() body: { code: string }) {
        return this.financialService.validateGiftCard(body.code);
    }
}
