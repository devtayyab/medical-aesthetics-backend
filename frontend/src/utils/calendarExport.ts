/**
 * "Add to calendar" helpers: an .ics (iCalendar, RFC 5545) download for Apple/Outlook
 * calendars and a Google Calendar template link. Times are exported in UTC ("Z"),
 * so every calendar app shows them in the user's own timezone (Europe/Athens for our clients).
 */
export interface CalendarEventInput {
  id?: string;
  title: string;
  start: string | Date;
  end?: string | Date | null;
  location?: string;
  description?: string;
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

const toDate = (v: string | Date): Date => (v instanceof Date ? v : new Date(v));

/** 2026-11-02T08:00:00.000Z -> 20261102T080000Z */
const toUtcStamp = (d: Date): string =>
  d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const resolveEnd = (event: CalendarEventInput): Date => {
  const start = toDate(event.start);
  const end = event.end ? toDate(event.end) : null;
  return end && !isNaN(end.getTime()) && end > start
    ? end
    : new Date(start.getTime() + DEFAULT_DURATION_MS);
};

/** RFC 5545 TEXT escaping */
const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** Fold content lines longer than 75 octets (continuation lines start with a space). */
const foldLine = (line: string): string => {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  parts.push(rest);
  return parts.join('\r\n ');
};

export const buildIcs = (event: CalendarEventInput): string => {
  const start = toDate(event.start);
  const end = resolveEnd(event);
  const uid = `${event.id || toUtcStamp(start)}@beautydoctors.gr`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BeautyDoctors//Appointments//EL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
};

export const downloadIcs = (event: CalendarEventInput, fileName = 'beautydoctors-appointment.ics'): void => {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const googleCalendarUrl = (event: CalendarEventInput): string => {
  const start = toDate(event.start);
  const end = resolveEnd(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/** Formats a clinic address that may be a string or an { street, city, ... } object. */
export const formatClinicLocation = (clinic?: { name?: string; address?: any } | null): string => {
  if (!clinic) return '';
  const addr = clinic.address;
  let addressText = '';
  if (typeof addr === 'string') {
    addressText = addr;
  } else if (addr && typeof addr === 'object') {
    addressText = [addr.street, addr.city, addr.zipCode || addr.postalCode, addr.country]
      .filter(Boolean)
      .join(', ');
  }
  return [clinic.name, addressText].filter(Boolean).join(', ');
};
