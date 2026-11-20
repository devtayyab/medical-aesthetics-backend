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
 * Email addresses we generate for guests / leads without a real email (including any
 * `noemail` or placeholder address). Sending to them bounces and hurts SES reputation,
 * so every outgoing email and notification path must skip them.
 */
export function isPlaceholderEmail(email?: string | null): boolean {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  if (!e || /\s/.test(e)) return true;
  const parts = e.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) return true;
  const [local, domain] = parts;
  return (
    e.includes('noemail') ||
    e.includes('no-email') ||
    e.includes('no_email') ||
    domain === 'example.com' ||
    domain === 'example.org' ||
    domain === 'example.net' ||
    domain.endsWith('.example.com') ||
    domain.includes('placeholder') ||
    domain.endsWith('.invalid') ||
    domain.endsWith('.local') ||
    domain.endsWith('.test') ||
    local.startsWith('guest-') ||
    local.startsWith('temp-')
  );
}
