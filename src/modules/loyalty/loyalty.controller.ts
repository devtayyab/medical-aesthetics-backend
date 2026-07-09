import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // A plain client may only ever act on their own loyalty account; staff may pass any clientId.
  private scopedClientId(requestedClientId: string, user: any): string {
    return user?.role === 'client' ? user.id : requestedClientId;
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Get active rewards catalog from DB' })
  getCatalog() {
    return this.loyaltyService.getRewardsCatalog();
  }

  @Get(':clientId')
  @ApiOperation({ summary: 'Get client loyalty balance and tier' })
  getBalance(
    @Param('clientId') clientId: string,
    @Request() req: any,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.loyaltyService.getClientBalance(this.scopedClientId(clientId, req.user), clinicId);
  }

  @Get(':clientId/history')
  @ApiOperation({ summary: 'Get loyalty transaction history' })
  getHistory(
    @Param('clientId') clientId: string,
    @Request() req: any,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.loyaltyService.getTransactionHistory(this.scopedClientId(clientId, req.user), clinicId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem points for discount' })
  redeemPoints(@Body() redeemPointsDto: RedeemPointsDto, @Request() req: any) {
    return this.loyaltyService.redeemPoints(
      this.scopedClientId(redeemPointsDto.clientId, req.user),
      redeemPointsDto.clinicId,
      redeemPointsDto.points,
      redeemPointsDto.description,
      req.user?.id,
    );
  }
}