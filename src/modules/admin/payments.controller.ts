import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Admin Payments')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get('ledger')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get unified ledger transactions for payments and turnover' })
    getLedger(
        @Query('clinicId') clinicId?: string,
        @Query('providerId') providerId?: string,
        @Query('salespersonId') salespersonId?: string,
        @Query('date') date?: string,
        @Query('method') method?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number
    ) {
        return this.paymentsService.getLedger({ clinicId, providerId, salespersonId, date, method, limit, offset });
    }

    @Post(':id/refund')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Refund a payment' })
    refund(@Param('id') id: string, @Body('notes') notes: string, @Req() req: any) {
        return this.paymentsService.refund(id, notes, req.user.id);
    }

    @Post(':id/void')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Void a payment' })
    void(@Param('id') id: string, @Body('notes') notes: string, @Req() req: any) {
        return this.paymentsService.void(id, notes, req.user.id);
    }
}
