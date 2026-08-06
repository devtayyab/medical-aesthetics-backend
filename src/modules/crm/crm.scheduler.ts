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
      this.autoSyncFacebookLeads().catch((err) =>
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

  // Every day at 04:00 AM
  @Cron('0 4 * * *')
  async injectAppointmentConfirmations() {
    try {
      this.logger.log('Injecting upcoming appointment confirmation tasks...');
      const result = await this.crmService.scheduledInjectConfirmationTask();
      this.logger.log(`Confirmation tasks injected: ${result.injected}`);
    } catch (err) {
      this.logger.error('Failed to inject confirmation tasks', err as any);
    }
  }

  // Every day at 05:00 AM
  @Cron('0 5 * * *')
  async injectNextDayFollowUps() {
    try {
      this.logger.log('Injecting post-treatment follow-up tasks...');
      const result = await this.crmService.scheduledInjectNextDayFollowUp();
      this.logger.log(`Follow-up tasks injected: ${result.injected}`);
    } catch (err) {
      this.logger.error('Failed to inject follow-up tasks', err as any);
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

  // Every 30 minutes: Automated background sync for active Facebook lead forms
  @Cron('*/30 * * * *')
  async autoSyncFacebookLeads() {
    try {
      this.logger.log('Starting automated Facebook lead sync...');
      const forms = await this.crmService.getFacebookForms();

      // DB-only pseudo forms (id: 'db_<name>') have no Facebook form to fetch from
      const liveForms = (forms || []).filter(
        (f) => f.id && !String(f.id).startsWith('db_'),
      );
      if (liveForms.length === 0) {
        // getForms() returns [] on API errors, so an all-pseudo list usually
        // means an expired token / permission problem — surface it loudly
        this.logger.error(
          'FB sync: zero live forms returned from the Facebook API — check access token, permissions, and page ID.',
        );
        return;
      }

      let importedCount = 0;
      for (const form of liveForms) {
        // Paused/archived forms can still hold unimported leads — only skip deleted ones.
        // facebookLeadId dedup makes re-fetching cheap and idempotent.
        if (form.status === 'DELETED') continue;
        try {
          // Pass the page token resolved during form discovery so the import
          // doesn't have to re-enumerate pages per form
          const leads = await this.crmService.importFacebookLeads(form.id, 10000, form.page_access_token);
          importedCount += leads.length;
        } catch (err) {
          // One failing form must not abort the sync of the remaining forms
          this.logger.error(`FB lead sync failed for form ${form.id} (${form.name})`, err as any);
        }
      }
      this.logger.log(`Automated Facebook sync completed. Forms checked: ${liveForms.length}, new leads imported: ${importedCount}.`);
    } catch (error) {
      this.logger.error('Failed to auto-sync Facebook leads', error as any);
    }
  }
}
