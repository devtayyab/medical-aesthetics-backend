import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { calendar_v3 } from 'googleapis';
import { Appointment } from '../../bookings/entities/appointment.entity';
import { BlockedTimeSlot } from '../../bookings/entities/blocked-time-slot.entity';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { CalendarConnectionService } from './calendar-connection.service';
import { GoogleCalendarClientService } from './google-calendar-client.service';
import { ClinicCalendarConnection } from '../entities/clinic-calendar-connection.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { GoogleCalendarConfig } from '../google-calendar.config';

// Statuses whose appointments should NOT appear on the calendar — the event is
// deleted if it exists.
const REMOVED_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.DELETED,
];

/** Marks the private extended property that identifies app-created events. */
export const APP_EVENT_MARKER = 'appAppointmentId';

@Injectable()
export class CalendarOutboundService {
  private readonly logger = new Logger(CalendarOutboundService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepo: Repository<Appointment>,
    @InjectRepository(BlockedTimeSlot)
    private readonly blockedRepo: Repository<BlockedTimeSlot>,
    private readonly connectionService: CalendarConnectionService,
    private readonly calendarClient: GoogleCalendarClientService,
    private readonly notificationsService: NotificationsService,
    private readonly config: GoogleCalendarConfig,
  ) {}

  /**
   * Reconciles a single appointment with the clinic's Google Calendar. Idempotent:
   * creates the event if missing, patches it if present, deletes it for
   * cancelled/no-show/deleted appointments. No-ops when the clinic isn't connected.
   */
  async syncAppointment(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentsRepo.findOne({
      where: { id: appointmentId },
      relations: ['clinic', 'service', 'service.treatment', 'provider', 'client'],
    });
    if (!appointment) {
      this.logger.warn(`syncAppointment: appointment ${appointmentId} not found`);
      return;
    }

    const connection = await this.connectionService.findByClinicId(
      appointment.clinicId,
    );
    if (!this.isSyncable(connection)) return;

    const client = this.connectionService.getCalendarClient(connection);
    const shouldRemove = REMOVED_STATUSES.includes(appointment.status);

    try {
      if (shouldRemove) {
        await this.removeEvent(appointment, connection, client);
      } else {
        await this.upsertEvent(appointment, connection, client);
      }
    } catch (err) {
      await this.handleSyncError(appointment, connection, err);
      throw err; // let the Bull job retry
    }
  }

  async syncBlockedSlot(
    slotId: string,
    deleted?: boolean,
    clinicIdOverride?: string,
    externalEventId?: string,
  ): Promise<void> {
    let slot: BlockedTimeSlot | null = null;
    let clinicId = clinicIdOverride;
    
    if (!deleted) {
      slot = await this.blockedRepo.findOne({ where: { id: slotId } });
      if (!slot) return;
      clinicId = slot.clinicId;
    }
    
    if (!clinicId) return;
    
    const connection = await this.connectionService.findByClinicId(clinicId);
    if (!this.isSyncable(connection)) return;
    const client = this.connectionService.getCalendarClient(connection);

    try {
      if (deleted) {
        if (!externalEventId) return;
        try {
          await this.calendarClient.deleteEvent(client, connection.calendarId, externalEventId);
        } catch (err: any) {
          if (err?.code !== 404 && err?.response?.status !== 404 && err?.code !== 410) throw err;
        }
      } else if (slot) {
        const eventIdToPatch = slot.externalEventId;
        const event: calendar_v3.Schema$Event = {
          summary: slot.reason || 'Blocked Time',
          start: { dateTime: slot.startTime.toISOString() },
          end: { dateTime: slot.endTime.toISOString() },
          extendedProperties: {
            private: {
              appBlockedSlotId: slot.id,
              appClinicId: slot.clinicId,
              appSource: 'beauty-doctors',
            },
          },
        };

        if (eventIdToPatch) {
          try {
            await this.calendarClient.patchEvent(client, connection.calendarId, eventIdToPatch, event);
          } catch (err: any) {
            if (err?.code === 404 || err?.response?.status === 404) {
              const newId = await this.calendarClient.insertEvent(client, connection.calendarId, event);
              await this.markBlockedSlotSynced(slot.id, newId);
            } else {
              throw err;
            }
          }
        } else {
          const newId = await this.calendarClient.insertEvent(client, connection.calendarId, event);
          await this.markBlockedSlotSynced(slot.id, newId);
        }
      }
    } catch (err: any) {
      this.logger.error(`Outbound sync failed for blocked slot ${slotId}: ${err.message}`);
      throw err;
    }
  }

  private async markBlockedSlotSynced(slotId: string, eventId: string): Promise<void> {
    await this.blockedRepo.update(slotId, {
      externalEventId: eventId,
      externalSyncedAt: new Date(),
      source: 'manual', // since it's outbound
    });
  }

  /** Pushes all future non-removed appointments for a clinic (used on connect). */
  async backfillClinic(clinicId: string): Promise<number> {
    const connection = await this.connectionService.findByClinicId(clinicId);
    if (!this.isSyncable(connection)) return 0;

    const upcoming = await this.appointmentsRepo.find({
      where: {
        clinicId,
        startTime: MoreThan(new Date()),
        status: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.PENDING_PAYMENT,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.ARRIVED,
          AppointmentStatus.IN_PROGRESS,
        ]),
      },
    });

    let synced = 0;
    for (const appt of upcoming) {
      try {
        await this.syncAppointment(appt.id);
        synced++;
      } catch (err) {
        this.logger.error(
          `Backfill failed for appointment ${appt.id}: ${err.message}`,
        );
      }
    }
    this.logger.log(`Backfilled ${synced}/${upcoming.length} appointments for clinic ${clinicId}`);
    return synced;
  }

  private isSyncable(
    connection: ClinicCalendarConnection | null,
  ): connection is ClinicCalendarConnection {
    return Boolean(
      connection &&
        connection.status === 'connected' &&
        connection.syncEnabled &&
        connection.calendarId,
    );
  }

  private async upsertEvent(
    appointment: Appointment,
    connection: ClinicCalendarConnection,
    client: calendar_v3.Calendar,
  ): Promise<void> {
    const event = this.buildEvent(appointment, connection);

    if (appointment.googleCalendarEventId) {
      try {
        await this.calendarClient.patchEvent(
          client,
          connection.calendarId,
          appointment.googleCalendarEventId,
          event,
        );
      } catch (err: any) {
        // Event was deleted on Google's side — recreate it.
        if (err?.code === 404 || err?.response?.status === 404) {
          const newId = await this.calendarClient.insertEvent(
            client,
            connection.calendarId,
            event,
          );
          await this.markSynced(appointment.id, newId);
          return;
        }
        throw err;
      }
      await this.markSynced(appointment.id, appointment.googleCalendarEventId);
    } else {
      const eventId = await this.calendarClient.insertEvent(
        client,
        connection.calendarId,
        event,
      );
      await this.markSynced(appointment.id, eventId);
    }
  }

  private async removeEvent(
    appointment: Appointment,
    connection: ClinicCalendarConnection,
    client: calendar_v3.Calendar,
  ): Promise<void> {
    if (!appointment.googleCalendarEventId) return;
    try {
      await this.calendarClient.deleteEvent(
        client,
        connection.calendarId,
        appointment.googleCalendarEventId,
      );
    } catch (err: any) {
      // Already gone — treat as success.
      if (err?.code !== 404 && err?.response?.status !== 404 && err?.code !== 410) {
        throw err;
      }
    }
    await this.appointmentsRepo.update(appointment.id, {
      googleCalendarEventId: null,
      googleCalendarSyncedAt: new Date(),
      googleCalendarSyncStatus: 'synced',
    });
  }

  /** Maps an appointment into a Google Calendar event payload. */
  private buildEvent(
    appointment: Appointment,
    connection: ClinicCalendarConnection,
  ): calendar_v3.Schema$Event {
    const serviceName =
      appointment.service?.treatment?.name ||
      (appointment.service as any)?.name ||
      'Appointment';
    const clientName =
      appointment.client
        ? `${appointment.client.firstName ?? ''} ${appointment.client.lastName ?? ''}`.trim()
        : appointment.clientDetails?.fullName || 'Client';
    const providerName = appointment.provider
      ? `${appointment.provider.firstName ?? ''} ${appointment.provider.lastName ?? ''}`.trim()
      : null;
    const timeZone = appointment.clinic?.timezone || undefined;

    // Data minimization: by default we export only service, client name,
    // provider and status. Phone and free-text notes (which may hold clinical
    // detail) are included ONLY when explicitly enabled via config.
    const includeContact = this.config.includeClientContactInEvents;
    const phone =
      appointment.clientDetails?.phone || appointment.client?.phone || null;

    const descriptionLines = [
      `Client: ${clientName}`,
      providerName ? `Provider: ${providerName}` : null,
      includeContact && phone ? `Phone: ${phone}` : null,
      `Status: ${appointment.status}`,
      includeContact && appointment.notes ? `Notes: ${appointment.notes}` : null,
      `— Synced from Beauty Doctors (do not edit; changes are overwritten)`,
    ].filter(Boolean);

    return {
      summary: `${serviceName} — ${clientName}`,
      description: descriptionLines.join('\n'),
      start: { dateTime: new Date(appointment.startTime).toISOString(), timeZone },
      end: { dateTime: new Date(appointment.endTime).toISOString(), timeZone },
      extendedProperties: {
        private: {
          [APP_EVENT_MARKER]: appointment.id,
          appClinicId: appointment.clinicId,
          appSource: 'beauty-doctors',
        },
      },
    };
  }

  private async markSynced(appointmentId: string, eventId: string): Promise<void> {
    await this.appointmentsRepo.update(appointmentId, {
      googleCalendarEventId: eventId,
      googleCalendarSyncedAt: new Date(),
      googleCalendarSyncStatus: 'synced',
    });
  }

  private async handleSyncError(
    appointment: Appointment,
    connection: ClinicCalendarConnection,
    err: any,
  ): Promise<void> {
    await this.appointmentsRepo.update(appointment.id, {
      googleCalendarSyncStatus: 'failed',
    });
    // invalid_grant / 401 means the refresh token is dead → mark connection so
    // the clinic is prompted to reconnect (handled by the connection service layer).
    const status = err?.response?.status ?? err?.code;
    const isAuthError =
      status === 401 ||
      /invalid_grant|invalid_token/i.test(err?.message ?? '');
    if (isAuthError) {
      // Notify the clinic once, on the transition into the error state, so staff
      // reconnect Google. Subsequent failures won't re-notify (already 'error').
      const wasConnected = connection.status === 'connected';
      await this.connectionService.markError(
        connection.id,
        `Auth failed during outbound sync: ${err.message}`,
      );
      if (wasConnected) {
        try {
          await this.notificationsService.notifyClinicStaff(
            connection.clinicId,
            'Google Calendar disconnected',
            'Your Google Calendar sync stopped working and needs to be reconnected. ' +
              'Open Settings → Calendar and connect Google again.',
            { type: 'google_calendar_reconnect_required', clinicId: connection.clinicId },
          );
        } catch (notifyErr) {
          this.logger.error(`Failed to send reconnect notification: ${notifyErr.message}`);
        }
      }
    }
    this.logger.error(
      `Outbound sync failed for appointment ${appointment.id} (clinic ${appointment.clinicId}): ${err.message}`,
    );
  }
}
