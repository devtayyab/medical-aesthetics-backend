import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
    constructor(private readonly financialService: FinancialService) { }

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
}
