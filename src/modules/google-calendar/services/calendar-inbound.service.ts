import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { calendar_v3 } from 'googleapis';
import { BlockedTimeSlot } from '../../bookings/entities/blocked-time-slot.entity';
import { CalendarConnectionService } from './calendar-connection.service';
import { GoogleCalendarClientService } from './google-calendar-client.service';
import { APP_EVENT_MARKER } from './calendar-outbound.service';
import { ClinicCalendarConnection } from '../entities/clinic-calendar-connection.entity';

/**
 * Pulls externally-created Google Calendar events into the app as busy/blocked
 * time so the availability engine won't double-book those slots. App-created
 * events are skipped (loop prevention); appointments are never fabricated.
 */
@Injectable()
export class CalendarInboundService {
  private readonly logger = new Logger(CalendarInboundService.name);

  constructor(
    @InjectRepository(BlockedTimeSlot)
    private readonly blockedRepo: Repository<BlockedTimeSlot>,
    private readonly connectionService: CalendarConnectionService,
    private readonly calendarClient: GoogleCalendarClientService,
  ) {}

  /** Incremental sync for one clinic connection. Safe to call concurrently-ish. */
  async syncClinic(clinicId: string): Promise<void> {
    const connection = await this.connectionService.findByClinicId(clinicId);
    if (
      !connection ||
      connection.status !== 'connected' ||
      !connection.syncEnabled ||
      !connection.calendarId
    ) {
      return;
    }

    const client = this.connectionService.getCalendarClient(connection);

    let result = await this.calendarClient.listChangedEvents(
      client,
      connection.calendarId,
      { syncToken: connection.syncToken },
    );

    // Expired sync token → restart from a bounded full listing.
    if (result.syncTokenExpired) {
      this.logger.warn(
        `Sync token expired for clinic ${clinicId}; performing full resync`,
      );
      result = await this.calendarClient.listChangedEvents(
        client,
        connection.calendarId,
        { syncToken: null, timeMin: new Date() },
      );
    }

    for (const event of result.events) {
      try {
        await this.processEvent(connection, event);
      } catch (err) {
        this.logger.error(
          `Failed processing inbound event ${event.id} for clinic ${clinicId}: ${err.message}`,
        );
      }
    }

    // Persist the new cursor only after processing so nothing is skipped on failure.
    await this.connectionService.markSynced(
      connection.id,
      result.nextSyncToken ?? undefined,
    );
  }

  private async processEvent(
    connection: ClinicCalendarConnection,
    event: calendar_v3.Schema$Event,
  ): Promise<void> {
    if (!event.id) return;

    // Loop prevention: never re-import events this app created.
    if (event.extendedProperties?.private?.[APP_EVENT_MARKER]) return;

    const existing = await this.blockedRepo.findOne({
      where: {
        clinicId: connection.clinicId,
        externalEventId: event.id,
        source: 'google_calendar',
      },
    });

    // Deleted/cancelled on Google → remove the corresponding block.
    if (event.status === 'cancelled') {
      if (existing) await this.blockedRepo.remove(existing);
      return;
    }

    // Only timed events map cleanly to a busy interval; skip all-day events.
    const startIso = event.start?.dateTime;
    const endIso = event.end?.dateTime;
    if (!startIso || !endIso) {
      this.logger.debug(
        `Skipping all-day/undated event ${event.id} for clinic ${connection.clinicId}`,
      );
      return;
    }

    const reason = `Google Calendar: ${event.summary || 'Busy'}`.slice(0, 250);

    if (existing) {
      existing.startTime = new Date(startIso);
      existing.endTime = new Date(endIso);
      existing.reason = reason;
      existing.externalSyncedAt = new Date();
      await this.blockedRepo.save(existing);
    } else {
      const slot = this.blockedRepo.create({
        clinicId: connection.clinicId,
        providerId: null, // external events block the whole clinic
        startTime: new Date(startIso),
        endTime: new Date(endIso),
        reason,
        source: 'google_calendar',
        externalEventId: event.id,
        externalSyncedAt: new Date(),
      });
      await this.blockedRepo.save(slot);
    }
  }
}
