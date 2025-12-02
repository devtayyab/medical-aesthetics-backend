import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdAttribution } from '../entities/ad-attribution.entity';
import { AdCampaign } from '../entities/ad-campaign.entity';
import { CustomerRecord } from '../entities/customer-record.entity';
import { AdCampaignMetricsDto } from '../dto/ad-campaign-metrics.dto';

@Injectable()
export class AdAttributionService {
  constructor(
    @InjectRepository(AdAttribution)
    private readonly adAttributionRepository: Repository<AdAttribution>,
    @InjectRepository(AdCampaign)
    private readonly adCampaignRepository: Repository<AdCampaign>,
    @InjectRepository(CustomerRecord)
    private readonly customerRecordRepository: Repository<CustomerRecord>,
  ) {}

  async recordInteraction(
    customerRecordId: string,
    adCampaignId: string,
    isConversion = false,
  ): Promise<AdAttribution> {
    let attribution = await this.adAttributionRepository.findOne({
      where: { customerRecordId, adCampaignId },
    });

    if (!attribution) {
      attribution = this.adAttributionRepository.create({
        customerRecordId,
        adCampaignId,
        firstInteractionAt: new Date(),
        lastInteractionAt: new Date(),
        interactionCount: 1,
        converted: isConversion,
        convertedAt: isConversion ? new Date() : null,
      });
    } else {
      attribution.recordInteraction(isConversion);
    }

    return this.adAttributionRepository.save(attribution);
  }

  async getCampaignMetrics(campaignId: string): Promise<AdCampaignMetricsDto> {
    const campaign = await this.adCampaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const [customerCount, convertedCount] = await Promise.all([
      this.customerRecordRepository.count({
        where: { facebookCampaignId: campaign.externalId },
      }),
      this.adAttributionRepository.count({
        where: { adCampaignId: campaignId, converted: true },
      }),
    ]);

    // In a real implementation, you would fetch these from the ad platform API
    const metrics: AdCampaignMetricsDto = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform,
      impressions: 10000, // Mock data - replace with actual API call
      clicks: 500, // Mock data - replace with actual API call
      spend: campaign.budget || 0,
      leads: customerCount,
      conversions: convertedCount,
      costPerLead: customerCount > 0 ? (campaign.budget || 0) / customerCount : 0,
      conversionRate: customerCount > 0 ? (convertedCount / customerCount) * 100 : 0,
      revenue: customerCount * 150, // Mock data - replace with actual calculation
      roi: campaign.budget && campaign.budget > 0 
        ? ((customerCount * 150 - campaign.budget) / campaign.budget) * 100 
        : 0,
      startDate: campaign.startDate || new Date(),
      endDate: campaign.endDate,
    };

    return metrics;
  }

  async getCampaignsPerformance(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AdCampaignMetricsDto[]> {
    const query = this.adCampaignRepository.createQueryBuilder('campaign');

    if (startDate) {
      query.andWhere('campaign.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('(campaign.endDate IS NULL OR campaign.endDate <= :endDate)', { endDate });
    }

    const campaigns = await query.getMany();
    return Promise.all(campaigns.map(campaign => this.getCampaignMetrics(campaign.id)));
  }

  /**
   * Synchronizes campaign metrics with the ad platform
   * @returns Object containing the number of updated campaigns
   */
  async syncCampaignMetrics(): Promise<{ updated: number }> {
    // Get all active campaigns
    const now = new Date();
    const campaigns = await this.adCampaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.startDate <= :now', { now })
      .andWhere('(campaign.endDate IS NULL OR campaign.endDate >= :now)', { now })
      .getMany();

    let updatedCount = 0;

    // In a real implementation, you would batch these API calls
    for (const campaign of campaigns) {
      try {
        // In a real implementation, you would fetch this from the ad platform API
        // This is a simplified example that just updates the local metrics
        await this.getCampaignMetrics(campaign.id);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to sync metrics for campaign ${campaign.id}:`, error);
      }
    }

    return { updated: updatedCount };
  }
}
