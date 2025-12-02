import { ApiProperty } from '@nestjs/swagger';

export class AdCampaignMetricsDto {
  @ApiProperty({ description: 'Unique identifier of the campaign' })
  campaignId: string;

  @ApiProperty({ description: 'Name of the campaign' })
  campaignName: string;

  @ApiProperty({ description: 'Platform where the campaign is running (facebook, google, etc.)' })
  platform: string;

  @ApiProperty({ description: 'Number of impressions' })
  impressions: number;

  @ApiProperty({ description: 'Number of clicks' })
  clicks: number;

  @ApiProperty({ description: 'Total spend on the campaign' })
  spend: number;

  @ApiProperty({ description: 'Number of leads generated' })
  leads: number;

  @ApiProperty({ description: 'Number of conversions' })
  conversions: number;

  @ApiProperty({ description: 'Cost per lead' })
  costPerLead: number;

  @ApiProperty({ description: 'Conversion rate as a percentage' })
  conversionRate: number;

  @ApiProperty({ description: 'Total revenue generated' })
  revenue: number;

  @ApiProperty({ description: 'Return on investment as a percentage' })
  roi: number;

  @ApiProperty({ description: 'Campaign start date' })
  startDate: Date;

  @ApiProperty({ description: 'Campaign end date (if applicable)', required: false })
  endDate: Date | null;
}
