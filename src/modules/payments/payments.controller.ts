import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { VivaWalletService } from './viva-wallet.service';

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
        return this.financialService.getLedger({
            clientId: req.user.id,
            limit: limit || 50,
            offset: offset || 0,
        });
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
