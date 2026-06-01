import { formatInTimeZone } from 'date-fns-tz';

/**
 * Timezone conventions for the whole app:
 *  - The DB stores every instant as UTC (`timestamptz`).
 *  - The API always sends/receives UTC ISO strings on `startTime`/`endTime`.
 *  - Any human-readable string is formatted in the *clinic's* timezone, never
 *    the implicit server/browser timezone. This keeps the "add event" dropdown
 *    and the calendar table showing the exact same wall-clock time.
 *
 * Pass the clinic's `timezone` (an IANA name like "Europe/Berlin"). When it is
 * missing or invalid we fall back to UTC so we never throw on display.
 */
export const DEFAULT_TIMEZONE = 'UTC';

function safeTimezone(timezone?: string | null): string {
  return timezone && timezone.trim().length > 0 ? timezone : DEFAULT_TIMEZONE;
}

function withFallback(timezone: string | undefined | null, fn: (tz: string) => string): string {
  try {
    return fn(safeTimezone(timezone));
  } catch {
    // Bad timezone — retry in UTC.
    try {
      return fn(DEFAULT_TIMEZONE);
    } catch {
      // Bad/invalid date too: never throw from a display formatter.
      return '';
    }
  }
}

/** e.g. "29/05/2026" in the clinic's timezone. */
export function formatDateInTz(date: Date, timezone?: string | null): string {
  return withFallback(timezone, (tz) => formatInTimeZone(date, tz, 'dd/MM/yyyy'));
}

/** e.g. "14:30" (24h) in the clinic's timezone. */
export function formatTimeInTz(date: Date, timezone?: string | null): string {
  return withFallback(timezone, (tz) => formatInTimeZone(date, tz, 'HH:mm'));
}

/** e.g. "29/05/2026, 14:30" in the clinic's timezone. */
export function formatDateTimeInTz(date: Date, timezone?: string | null): string {
  return withFallback(timezone, (tz) => formatInTimeZone(date, tz, 'dd/MM/yyyy, HH:mm'));
}
