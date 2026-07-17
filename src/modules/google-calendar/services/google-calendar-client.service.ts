import { Injectable, Logger } from '@nestjs/common';
import { calendar_v3 } from 'googleapis';

export interface WatchResult {
  channelId: string;
  resourceId: string;
  expiration: Date | null;
}

export interface IncrementalSyncResult {
  events: calendar_v3.Schema$Event[];
  nextSyncToken: string | null;
  /** True when Google returned 410 GONE — caller must do a full resync. */
  syncTokenExpired: boolean;
}

/**
 * Thin, stateless wrapper over the Google Calendar v3 REST API. All methods take
 * an already-authenticated client so this class holds no per-clinic state.
 */
@Injectable()
export class GoogleCalendarClientService {
  private readonly logger = new Logger(GoogleCalendarClientService.name);

  /** The id of the account's primary calendar equals the account email. */
  async getAccountEmail(client: calendar_v3.Calendar): Promise<string | null> {
    try {
      const res = await client.calendars.get({ calendarId: 'primary' });
      return res.data.id ?? null;
    } catch (err) {
      this.logger.warn(`Could not resolve account email: ${err.message}`);
      return null;
    }
  }

  /**
   * Lists the calendars the authorized account can WRITE to (owner/writer),
   * so the clinic can choose which one to sync. `primary` marks the account's
   * main calendar.
   */
  async listWritableCalendars(
    client: calendar_v3.Calendar,
  ): Promise<Array<{ id: string; summary: string; primary: boolean; accessRole: string }>> {
    const items: calendar_v3.Schema$CalendarListEntry[] = [];
    let pageToken: string | undefined;
    do {
      const res = await client.calendarList.list({ maxResults: 250, pageToken });
      (res.data.items ?? []).forEach((c) => items.push(c));
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    return items
      .filter((c) => c.accessRole === 'owner' || c.accessRole === 'writer')
      .map((c) => ({
        id: c.id,
        summary: c.summaryOverride || c.summary || c.id,
        primary: Boolean(c.primary),
        accessRole: c.accessRole,
      }));
  }

  /** Optionally create a brand-new calendar (offered as a picker option). */
  async createCalendar(
    client: calendar_v3.Calendar,
    summary: string,
    timeZone?: string,
  ): Promise<{ id: string; summary: string }> {
    const res = await client.calendars.insert({
      requestBody: { summary, timeZone: timeZone || undefined },
    });
    return { id: res.data.id, summary: res.data.summary || summary };
  }

  async insertEvent(
    client: calendar_v3.Calendar,
    calendarId: string,
    event: calendar_v3.Schema$Event,
  ): Promise<string> {
    const res = await client.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: 'none',
    });
    return res.data.id;
  }

  async patchEvent(
    client: calendar_v3.Calendar,
    calendarId: string,
    eventId: string,
    event: calendar_v3.Schema$Event,
  ): Promise<void> {
    await client.events.patch({
      calendarId,
      eventId,
      requestBody: event,
      sendUpdates: 'none',
    });
  }

  async deleteEvent(
    client: calendar_v3.Calendar,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    await client.events.delete({ calendarId, eventId, sendUpdates: 'none' });
  }

  /**
   * Registers a push-notification (watch) channel on the calendar's events feed.
   * `ttlSeconds` bounds channel life (Google caps calendar channels near 7 days).
   */
  async watchEvents(
    client: calendar_v3.Calendar,
    calendarId: string,
    params: { channelId: string; address: string; token: string; ttlSeconds?: number },
  ): Promise<WatchResult> {
    const res = await client.events.watch({
      calendarId,
      requestBody: {
        id: params.channelId,
        type: 'web_hook',
        address: params.address,
        token: params.token,
        params: params.ttlSeconds
          ? { ttl: String(params.ttlSeconds) }
          : undefined,
      },
    });
    return {
      channelId: res.data.id ?? params.channelId,
      resourceId: res.data.resourceId,
      expiration: res.data.expiration
        ? new Date(Number(res.data.expiration))
        : null,
    };
  }

  async stopChannel(
    client: calendar_v3.Calendar,
    channelId: string,
    resourceId: string,
  ): Promise<void> {
    await client.channels.stop({ requestBody: { id: channelId, resourceId } });
  }

  /**
   * Pulls changed events. Uses `syncToken` for incremental sync when present,
   * otherwise a bounded full listing (from `timeMin`). Follows pagination and
   * returns the fresh `nextSyncToken`. Detects 410 GONE (expired sync token).
   */
  async listChangedEvents(
    client: calendar_v3.Calendar,
    calendarId: string,
    opts: { syncToken?: string | null; timeMin?: Date },
  ): Promise<IncrementalSyncResult> {
    const events: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;

    try {
      do {
        const res = await client.events.list({
          calendarId,
          singleEvents: true,
          showDeleted: true,
          maxResults: 250,
          pageToken,
          ...(opts.syncToken
            ? { syncToken: opts.syncToken }
            : { timeMin: (opts.timeMin ?? new Date()).toISOString() }),
        });
        (res.data.items ?? []).forEach((e) => events.push(e));
        pageToken = res.data.nextPageToken ?? undefined;
        if (res.data.nextSyncToken) nextSyncToken = res.data.nextSyncToken;
      } while (pageToken);

      return { events, nextSyncToken, syncTokenExpired: false };
    } catch (err: any) {
      if (err?.code === 410 || err?.response?.status === 410) {
        return { events: [], nextSyncToken: null, syncTokenExpired: true };
      }
      throw err;
    }
  }
}
