import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrmService } from './crm.service';
import { AdAttributionService } from './services/ad-attribution.service';

@Injectable()
export class CrmScheduler {
  private readonly logger = new Logger(CrmScheduler.name);

  constructor(
    private readonly crmService: CrmService,
    @Inject(AdAttributionService)
    private readonly adAttributionService: AdAttributionService,
  ) { }

  // Every Monday at 08:00
  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyAgentReports() {
    try {
      const result = await this.crmService.sendWeeklyAgentReports();
      this.logger.log(`Weekly agent reports sent: ${result.sent}`);
    } catch (err) {
      this.logger.error('Failed to send weekly agent reports', err as any);
    }
  }

  // Every day at 03:00 AM
  @Cron('0 3 * * *')
  async syncAdCampaignMetrics() {
    try {
      this.logger.log('Starting daily ad campaign metrics sync...');
      const result = await this.adAttributionService.syncCampaignMetrics();
      this.logger.log(
        `Ad campaign metrics sync completed. Updated ${result.updated} campaigns.`,
      );
    } catch (error) {
      this.logger.error('Failed to sync ad campaign metrics', error as any);
    }
  }

  // Every day at 02:00 AM
  @Cron('0 2 * * *')
  async runTaskAutomation() {
    try {
      this.logger.log('Starting daily task automation check...');
      const result = await this.crmService.runTaskAutomationCheck();
      this.logger.log(
        `Task automation check completed. Tasks created: ${result.tasksCreated}, Overdue tasks updated: ${result.overdueTasks}`,
      );
    } catch (error) {
      this.logger.error('Failed to run task automation check', error as any);
    }
  }
}
