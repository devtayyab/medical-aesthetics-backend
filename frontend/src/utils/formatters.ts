/**
 * Common formatting helpers
 */

export const formatCurrency = (amount?: number | null, currency: string = '€'): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currency}0.00`;
  return `${currency}${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// ─── Dates and times ──────────────────────────────────────────────────────────
// Rule: every date/time on screen is shown in Europe/Athens (incl. DST),
// dates as dd/mm/yyyy and times as 24h HH:mm, whatever the viewer's browser zone.

export const APP_TIMEZONE = 'Europe/Athens';

export type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/** Unknown or malformed zones (e.g. a clinic saved with "GMT+2") fall back to Athens instead of throwing. */
const safeZone = (timeZone?: string | null): string => {
  if (!timeZone || timeZone === 'null') return APP_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return timeZone;
  } catch {
    return APP_TIMEZONE;
  }
};

const dateParts = (date: Date, zone: string) => {
  const timeZone = safeZone(zone);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  fmt.formatToParts(date).forEach((p) => {
    map[p.type] = p.value;
  });
  return map;
};

/** "28/10/2026" in Athens time. */
export const formatDate = (value: DateInput, timeZone: string = APP_TIMEZONE): string => {
  const date = toDate(value);
  if (!date) return '';
  const p = dateParts(date, timeZone);
  return `${p.day}/${p.month}/${p.year}`;
};

/** "08:00" (24h) in Athens time. */
export const formatTime = (value: DateInput, timeZone: string = APP_TIMEZONE): string => {
  const date = toDate(value);
  if (!date) return '';
  const p = dateParts(date, timeZone);
  return `${p.hour}:${p.minute}`;
};

/** "28/10/2026 08:00" in Athens time. */
export const formatDateTime = (value: DateInput, timeZone: string = APP_TIMEZONE): string => {
  const date = toDate(value);
  if (!date) return '';
  return `${formatDate(date, timeZone)} ${formatTime(date, timeZone)}`;
};

const currentLocale = (): string => {
  try {
    return localStorage.getItem('preferredLang') === 'el' ? 'el-GR' : 'en-GB';
  } catch {
    return 'en-GB';
  }
};

/** Weekday + date, e.g. "Wednesday, 28/10/2026" or "Τετάρτη, 28/10/2026", in Athens time. */
export const formatWeekdayDate = (value: DateInput, timeZone: string = APP_TIMEZONE): string => {
  const date = toDate(value);
  if (!date) return '';
  const weekday = new Intl.DateTimeFormat(currentLocale(), { timeZone: safeZone(timeZone), weekday: 'long' }).format(date);
  return `${weekday}, ${formatDate(date, timeZone)}`;
};

/** Short weekday, e.g. "Wed" or "Τετ", in Athens time. */
export const formatWeekdayShort = (value: DateInput, timeZone: string = APP_TIMEZONE): string => {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(currentLocale(), { timeZone: safeZone(timeZone), weekday: 'short' }).format(date);
};

/** Month + year, e.g. "October 2026" or "Οκτώβριος 2026", in Athens time. */
export const formatMonthYear = (value: DateInput, timeZone: string = APP_TIMEZONE): string => {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(currentLocale(), { timeZone: safeZone(timeZone), month: 'long', year: 'numeric' }).format(date);
};
