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

  @Get('catalog')
  @ApiOperation({ summary: 'Get active rewards catalog from DB' })
  getCatalog() {
    return this.loyaltyService.getRewardsCatalog();
  }

  @Get(':clientId')
  @ApiOperation({ summary: 'Get client loyalty balance and tier' })
  getBalance(
    @Param('clientId') clientId: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.loyaltyService.getClientBalance(clientId, clinicId);
  }

  @Get(':clientId/history')
  @ApiOperation({ summary: 'Get loyalty transaction history' })
  getHistory(
    @Param('clientId') clientId: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.loyaltyService.getTransactionHistory(clientId, clinicId);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem points for discount' })
  redeemPoints(@Body() redeemPointsDto: RedeemPointsDto, @Request() req: any) {
    return this.loyaltyService.redeemPoints(
      redeemPointsDto.clientId,
      redeemPointsDto.clinicId,
      redeemPointsDto.points,
      redeemPointsDto.description,
      req.user?.id,
    );
  }
}