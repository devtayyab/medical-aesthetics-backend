import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AdAttributionService } from '../services/ad-attribution.service';
import { AdCampaignMetricsDto } from '../dto/ad-campaign-metrics.dto';

@ApiTags('Ad Attribution')
@ApiBearerAuth()
@Controller('api/crm/ad-attribution')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdAttributionController {
  constructor(private readonly adAttributionService: AdAttributionService) {}

  @Get('campaign/:id/metrics')
  @ApiOperation({ summary: 'Get metrics for a specific ad campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns campaign metrics',
    type: AdCampaignMetricsDto
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignMetrics(
    @Param('id', ParseUUIDPipe) campaignId: string
  ): Promise<AdCampaignMetricsDto> {
    return this.adAttributionService.getCampaignMetrics(campaignId);
  }

  @Get('campaigns/performance')
  @ApiOperation({ summary: 'Get performance metrics for all campaigns' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns performance metrics for all campaigns',
    type: [AdCampaignMetricsDto]
  })
  async getCampaignsPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AdCampaignMetricsDto[]> {
    return this.adAttributionService.getCampaignsPerformance(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
