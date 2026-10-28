import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

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

/** Business timezone for CRM scheduling (tasks, confirmation calls). */
export const BUSINESS_TIMEZONE = 'Europe/Athens';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Moves `workingDays` Mon-Fri days away from the calendar day `date` falls on in
 * `timezone` (negative = backwards) and returns that day at `hour:minute` wall-clock
 * time in `timezone`, as a UTC instant. DST is handled by date-fns-tz.
 *
 * e.g. appointment Monday 10:00 Athens, -2 -> previous Thursday 08:00 Athens.
 */
export function addWorkingDaysAt(
  date: Date,
  workingDays: number,
  hour = 8,
  minute = 0,
  timezone: string = BUSINESS_TIMEZONE,
): Date {
  const [y, m, d] = formatInTimeZone(date, timezone, 'yyyy-MM-dd').split('-').map(Number);
  // Walk on a pure calendar date (UTC noon keeps the arithmetic clear of DST edges)
  const cursor = new Date(Date.UTC(y, m - 1, d, 12));
  const step = workingDays < 0 ? -1 : 1;
  let remaining = Math.abs(workingDays);
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + step);
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  const local = `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}-${pad2(cursor.getUTCDate())}T${pad2(hour)}:${pad2(minute)}:00`;
  return fromZonedTime(local, timezone);
}

/** Next working day (Mon-Fri) at 08:00 Athens, counted from `from`. */
export function nextWorkingDayAt0800(from: Date = new Date()): Date {
  return addWorkingDaysAt(from, 1, 8, 0, BUSINESS_TIMEZONE);
}

/** Due date of the automatic confirmation call: 2 working days before the appointment, 08:00 Athens. */
export function confirmationCallDueDate(appointmentStart: Date): Date {
  return addWorkingDaysAt(appointmentStart, -2, 8, 0, BUSINESS_TIMEZONE);
}

/**
 * Parses a wall-clock date "dd/mm/yyyy" (or "yyyy-mm-dd") plus optional "HH:mm" in
 * `timezone` into a UTC instant. Returns null when the input is not a valid date.
 */
export function parseWallClockInTz(
  dateStr: string,
  timeStr?: string | null,
  timezone: string = BUSINESS_TIMEZONE,
): Date | null {
  const s = (dateStr || '').trim();
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (match) {
    d = Number(match[1]); m = Number(match[2]); y = Number(match[3]);
  } else if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) {
    y = Number(match[1]); m = Number(match[2]); d = Number(match[3]);
  } else {
    return null;
  }
  // Time may be given separately or embedded after the date ("27/10/2026 14:30")
  const t = (timeStr || s.slice(match[0].length) || '').trim().match(/(\d{1,2})[:.](\d{2})/);
  const hh = t ? Number(t[1]) : 8;
  const mm = t ? Number(t[2]) : 0;
  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return null;
  const result = fromZonedTime(`${y}-${pad2(m)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:00`, timezone);
  return isNaN(result.getTime()) ? null : result;
}
