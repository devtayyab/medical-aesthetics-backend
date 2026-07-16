import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { GoogleCalendarConfig } from './google-calendar.config';
import { GoogleOAuthService } from './services/google-oauth.service';
import { CalendarConnectionService } from './services/calendar-connection.service';
import { GoogleCalendarClientService } from './services/google-calendar-client.service';
import { ClinicsService } from '../clinics/clinics.service';
import { ClinicCalendarConnection } from './entities/clinic-calendar-connection.entity';
import {
  CALENDAR_SYNC_QUEUE,
  JOB_BACKFILL_CLINIC,
  JOB_INBOUND_CLINIC,
} from './calendar-sync.constants';

// Google caps calendar watch channels at ~7 days; renew a bit early.
const WATCH_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly config: GoogleCalendarConfig,
    private readonly oauthService: GoogleOAuthService,
    private readonly connectionService: CalendarConnectionService,
    private readonly calendarClient: GoogleCalendarClientService,
    private readonly clinicsService: ClinicsService,
    @InjectQueue(CALENDAR_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  private assertEnabled(): void {
    if (!this.config.isEnabled()) {
      throw new ServiceUnavailableException(
        'Google Calendar integration is not configured on this server',
      );
    }
  }

  /** Connection status for the UI (never leaks tokens). */
  async getStatus(clinicId: string) {
    const connection = await this.connectionService.findByClinicId(clinicId);
    return {
      enabled: this.config.isEnabled(),
      connected: Boolean(connection && connection.status === 'connected'),
      status: connection?.status ?? 'disconnected',
      googleAccountEmail: connection?.googleAccountEmail ?? null,
      calendarId: connection?.calendarId ?? null,
      syncEnabled: connection?.syncEnabled ?? false,
      lastSyncedAt: connection?.lastSyncedAt ?? null,
      lastError: connection?.status === 'error' ? connection?.lastError : null,
    };
  }

  /** Builds the Google consent URL a clinic owner is redirected to. */
  async getConsentUrl(clinicId: string, userId: string): Promise<string> {
    this.assertEnabled();
    // Ensure the clinic exists (throws NotFound otherwise).
    await this.clinicsService.findById(clinicId);
    const state = this.oauthService.signState({ clinicId, userId });
    return this.oauthService.buildConsentUrl(state);
  }

  /**
   * OAuth callback handler: exchanges the code, provisions the dedicated
   * calendar + watch channel, and kicks off backfill + initial inbound sync.
   * Returns the clinicId so the controller can redirect appropriately.
   */
  async handleOAuthCallback(
    code: string,
    state: string,
  ): Promise<{ clinicId: string }> {
    this.assertEnabled();
    const { clinicId } = this.oauthService.verifyState(state);

    const existing = await this.connectionService.findByClinicId(clinicId);
    const tokens = await this.oauthService.exchangeCode(code);

    if (!tokens.refreshToken && !existing?.refreshTokenEnc) {
      throw new BadRequestException(
        'Google did not return a refresh token. Please remove app access in your ' +
          'Google account and try connecting again.',
      );
    }

    let connection = await this.connectionService.upsertFromTokens(
      clinicId,
      tokens,
      existing,
    );

    const client = this.connectionService.getCalendarClient(connection);

    // Resolve the authorizing account's email (primary calendar id == email).
    const email = await this.calendarClient.getAccountEmail(client);

    // Create the dedicated calendar once.
    if (!connection.calendarId) {
      const clinic = await this.clinicsService.findById(clinicId).catch(() => null);
      const calendarId = await this.calendarClient.createDedicatedCalendar(
        client,
        `Beauty Doctors — ${clinic?.name || 'Bookings'}`,
        clinic?.timezone,
      );
      await this.connectionService.update(connection.id, { calendarId });
      connection.calendarId = calendarId;
    }

    if (email) {
      await this.connectionService.update(connection.id, {
        googleAccountEmail: email,
      });
    }

    // Register the push channel for real-time inbound sync (non-fatal).
    try {
      await this.registerWatch(connection);
    } catch (err) {
      this.logger.error(
        `Watch registration failed for clinic ${clinicId} (polling will cover it): ${err.message}`,
      );
    }

    // Backfill existing appointments → Google, and pull current Google events in.
    await this.syncQueue.add(JOB_BACKFILL_CLINIC, { clinicId });
    await this.syncQueue.add(JOB_INBOUND_CLINIC, { clinicId });

    return { clinicId };
  }

  /** Disconnects a clinic: stops the watch channel, revokes + deletes the row. */
  async disconnect(clinicId: string): Promise<void> {
    const connection = await this.connectionService.findByClinicId(clinicId);
    if (!connection) throw new NotFoundException('No Google Calendar connection');

    try {
      await this.stopWatch(connection);
    } catch (err) {
      this.logger.warn(`stopWatch during disconnect failed (ignored): ${err.message}`);
    }
    await this.connectionService.disconnect(connection);
  }

  /** Registers (or re-registers) the events watch channel for a connection. */
  async registerWatch(connection: ClinicCalendarConnection): Promise<void> {
    if (!this.config.webhookCallbackUrl) {
      this.logger.warn(
        'GOOGLE_WEBHOOK_CALLBACK_URL not set — skipping watch registration (polling only)',
      );
      return;
    }
    if (!connection.calendarId) return;

    // Tear down any previous channel first.
    await this.stopWatch(connection).catch(() => undefined);

    const client = this.connectionService.getCalendarClient(connection);
    const channelId = uuidv4();
    const token = crypto.randomBytes(24).toString('hex');

    const watch = await this.calendarClient.watchEvents(
      client,
      connection.calendarId,
      {
        channelId,
        address: this.config.webhookCallbackUrl,
        token,
        ttlSeconds: WATCH_TTL_SECONDS,
      },
    );

    await this.connectionService.update(connection.id, {
      watchChannelId: watch.channelId,
      watchResourceId: watch.resourceId,
      watchToken: token,
      watchExpiration: watch.expiration,
    });
  }

  async stopWatch(connection: ClinicCalendarConnection): Promise<void> {
    if (!connection.watchChannelId || !connection.watchResourceId) return;
    const client = this.connectionService.getCalendarClient(connection);
    await this.calendarClient.stopChannel(
      client,
      connection.watchChannelId,
      connection.watchResourceId,
    );
    await this.connectionService.update(connection.id, {
      watchChannelId: null,
      watchResourceId: null,
      watchToken: null,
      watchExpiration: null,
    });
  }

  /**
   * Resolves an inbound push notification to a clinic and enqueues its sync.
   * Validates the channel token to reject spoofed calls.
   */
  async handleWebhook(headers: {
    channelId?: string;
    resourceId?: string;
    resourceState?: string;
    token?: string;
  }): Promise<void> {
    if (!headers.channelId) return;
    const connection = await this.connectionService.findByWatchChannelId(
      headers.channelId,
    );
    if (!connection) {
      this.logger.warn(`Webhook for unknown channel ${headers.channelId}`);
      return;
    }
    if (connection.watchToken && headers.token !== connection.watchToken) {
      this.logger.warn(`Webhook token mismatch for channel ${headers.channelId}`);
      return;
    }
    // 'sync' is the initial handshake ping — no changes to pull yet.
    if (headers.resourceState === 'sync') return;

    await this.syncQueue.add(JOB_INBOUND_CLINIC, { clinicId: connection.clinicId });
  }
}
