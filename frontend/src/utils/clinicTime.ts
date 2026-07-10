// Shared clinic-timezone date/time helpers.
//
// Appointments are stored as UTC instants (Postgres timestamptz) and the API
// returns them as ISO strings. A calendar must decide which *day column* an
// appointment belongs to and where it sits vertically. That decision has to be
// made in the CLINIC's timezone — NOT the browser's — otherwise an appointment
// booked for Monday 00:30 clinic-time (stored a few hours earlier in UTC) gets
// reinterpreted by `new Date(iso)` in the viewer's local zone and lands under
// Sunday. It also makes per-day COUNTS disagree with what is rendered
// ("5 active for Friday" but only 1 card shown) when the count and the render
// use different zones.
//
// Every calendar view should bucket/position appointments through these helpers.

export const sanitizeTz = (tz?: string | null): string => {
  if (!tz || tz === 'null' || tz.trim() === '') return 'UTC';
  return tz;
};

/** Wall-clock date ("YYYY-MM-DD") of a UTC instant in the given clinic timezone. */
export const getClinicLocalDate = (dateStr: string, timezone?: string): string => {
  const d = new Date(dateStr);
  const tz = sanitizeTz(timezone);
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(d); // en-CA yields "YYYY-MM-DD"
  } catch {
    return d.toISOString().split('T')[0];
  }
};

/** Wall-clock { hour, minute } of a UTC instant in the given clinic timezone. */
export const getClinicLocalTime = (dateStr: string, timezone?: string): { hour: number; minute: number } => {
  const d = new Date(dateStr);
  const tz = sanitizeTz(timezone);
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    const parts = fmt.formatToParts(d);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return { hour: isNaN(hour) ? 0 : hour, minute: isNaN(minute) ? 0 : minute };
  } catch {
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
};

/**
 * True when the UTC instant `dateStr` falls on calendar day `day` (a Date whose
 * y/m/d name the intended column) when read in the clinic timezone.
 * Drop-in replacement for the buggy `isSameDay(new Date(dateStr), day)`.
 */
export const isSameClinicDay = (dateStr: string, day: Date, timezone?: string): boolean => {
  const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return getClinicLocalDate(dateStr, timezone) === dayStr;
};
