import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { GoogleCalendarConfig } from './google-calendar.config';
import { CalendarConnectionService } from './services/calendar-connection.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CALENDAR_SYNC_QUEUE, JOB_INBOUND_CLINIC } from './calendar-sync.constants';

/**
 * Safety nets for inbound sync:
 *  - renew watch channels before they expire (Google caps them at ~7 days)
 *  - poll every 10 min in case a push notification was dropped or a channel is
 *    missing (e.g. GOOGLE_WEBHOOK_CALLBACK_URL not yet configured).
 */
@Injectable()
export class CalendarSyncScheduler {
  private readonly logger = new Logger(CalendarSyncScheduler.name);

  constructor(
    private readonly config: GoogleCalendarConfig,
    private readonly connectionService: CalendarConnectionService,
    private readonly googleCalendarService: GoogleCalendarService,
    @InjectQueue(CALENDAR_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pollInbound(): Promise<void> {
    if (!this.config.isEnabled()) return;
    const connections = await this.connectionService.findActive();
    for (const conn of connections) {
      await this.syncQueue.add(
        JOB_INBOUND_CLINIC,
        { clinicId: conn.clinicId },
        { removeOnComplete: true, removeOnFail: 50 },
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async renewExpiringWatches(): Promise<void> {
    if (!this.config.isEnabled() || !this.config.webhookCallbackUrl) return;
    // Renew anything expiring within the next 24h.
    const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiring = await this.connectionService.findWatchesExpiringBefore(cutoff);
    for (const conn of expiring) {
      try {
        await this.googleCalendarService.registerWatch(conn);
        this.logger.log(`Renewed watch channel for clinic ${conn.clinicId}`);
      } catch (err) {
        this.logger.error(
          `Failed to renew watch for clinic ${conn.clinicId}: ${err.message}`,
        );
      }
    }
  }
}
