import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrmService } from './crm.service';
import { AdAttributionService } from './services/ad-attribution.service';

@Injectable()
export class CrmScheduler implements OnModuleInit {
  private readonly logger = new Logger(CrmScheduler.name);

  constructor(
    private readonly crmService: CrmService,
    @Inject(AdAttributionService)
    private readonly adAttributionService: AdAttributionService,
  ) { }

  onModuleInit() {
    // Run FB lead auto-sync immediately 3 seconds after backend startup
    setTimeout(() => {
      this.autoSyncFacebookLeads('startup').catch((err) =>
        this.logger.error('Startup FB lead auto-sync failed', err),
      );
    }, 3000);
  }

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

  // Every day at 02:00 Athens
  @Cron('0 2 * * *', { timeZone: 'Europe/Athens' })
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

  // Every hour: keep the one confirmation-call task per booking in line with the
  // appointment (also catches booking edits that emit no event). Idempotent.
  @Cron('10 * * * *', { timeZone: 'Europe/Athens' })
  async injectAppointmentConfirmations() {
    try {
      const result = await this.crmService.scheduledInjectConfirmationTask();
      this.logger.log(`Confirmation tasks reconciled for ${result.injected} appointments`);
    } catch (err) {
      this.logger.error('Failed to reconcile confirmation tasks', err as any);
    }
  }

  // Every 15 minutes
  @Cron('*/15 * * * *')
  async runTaskReminders() {
    try {
      this.logger.log('Starting task reminders check...');
      const sent = await this.crmService.runTaskRemindersOnly();
      if (sent > 0) {
        this.logger.log(`Task reminders sent: ${sent}`);
      }
    } catch (error) {
      this.logger.error('Failed to run task reminders', error as any);
    }
  }

  // Every 30 minutes: Automated background sync for active Facebook lead forms.
  // Records a health status and alerts admins when the token is invalid or the
  // fetch fails; already-imported Facebook lead ids are skipped, so the first
  // successful run after an outage re-imports the missed leads without duplicates.
  @Cron('*/30 * * * *')
  async autoSyncFacebookLeads(trigger: 'cron' | 'startup' = 'cron') {
    try {
      this.logger.log('Starting automated Facebook lead sync...');
      const result = await this.crmService.runFacebookSync(trigger);
      if (result.errors.length > 0) {
        this.logger.error(`FB sync finished with errors: ${result.errors.slice(0, 3).join(' | ')}`);
      }
    } catch (error) {
      this.logger.error('Failed to auto-sync Facebook leads', error as any);
    }
  }
}
