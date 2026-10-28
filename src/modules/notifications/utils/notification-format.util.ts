import { formatInTimeZone } from 'date-fns-tz';

/**
 * All notification / email text is written for people in Greece, so every date and
 * time that ends up in a notification is rendered in Europe/Athens (DST aware),
 * as dd/MM/yyyy and 24h, regardless of the server timezone or the clinic setting.
 */
export const NOTIFICATION_TIMEZONE = 'Europe/Athens';

function safeFormat(date: Date | string | null | undefined, pattern: string): string {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return formatInTimeZone(d, NOTIFICATION_TIMEZONE, pattern);
  } catch {
    return '';
  }
}

/** "28/10/2026" */
export function athensDate(date: Date | string | null | undefined): string {
  return safeFormat(date, 'dd/MM/yyyy');
}

/** "08:00" */
export function athensTime(date: Date | string | null | undefined): string {
  return safeFormat(date, 'HH:mm');
}

/** "28/10/2026 08:00" */
export function athensDateTime(date: Date | string | null | undefined): string {
  return safeFormat(date, 'dd/MM/yyyy HH:mm');
}

/** Full name of a user-like object, or the fallback. Never returns an id. */
export function personName(user: any, fallback = ''): string {
  if (!user) return fallback;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || fallback;
}

/**
 * Email addresses we generate for guests / leads without an email. Sending to them only
 * bounces and hurts the SES sending reputation, so the mail path skips them.
 */
export function isPlaceholderEmail(email?: string | null): boolean {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  return (
    !e.includes('@') ||
    e.endsWith('@example.com') ||
    e.endsWith('.invalid') ||
    e.startsWith('guest-') ||
    e.startsWith('temp-')
  );
}
