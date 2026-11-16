// One list of call outcomes for every CRM screen (Process Task, client card, dialer).
export type CallOutcome =
  | 'interested'
  | 'call_later'
  | 'no_answer'
  | 'not_interested'
  | 'appointment_booked'
  | 'wrong_number';

export const CALL_OUTCOMES: { value: CallOutcome; label: string; labelEl: string }[] = [
  { value: 'interested', label: 'Interested', labelEl: 'Ενδιαφέρεται' },
  { value: 'call_later', label: 'Call Back', labelEl: 'Επανάκληση' },
  { value: 'no_answer', label: 'No Answer', labelEl: 'Δεν απάντησε' },
  { value: 'not_interested', label: 'Not Interested', labelEl: 'Δεν ενδιαφέρεται' },
  { value: 'appointment_booked', label: 'Appointment Booked', labelEl: 'Κλείστηκε ραντεβού' },
  { value: 'wrong_number', label: 'Wrong Number', labelEl: 'Λάθος αριθμός' },
];

/** Outcomes after which the SAME task stays open and moves to the next call date. */
export const KEEP_TASK_OPEN_OUTCOMES: string[] = ['interested', 'call_later', 'no_answer'];

export const outcomeLabel = (value?: string, greek = false): string => {
  const found = CALL_OUTCOMES.find(o => o.value === value);
  if (!found) return (value || '').replace(/_/g, ' ');
  return greek ? found.labelEl : found.label;
};

const pad = (n: number) => String(n).padStart(2, '0');

const athensParts = (date: Date) => {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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

/**
 * Converts a wall-clock string "YYYY-MM-DDTHH:mm" in Europe/Athens into a UTC Date,
 * regardless of the browser's OS timezone.
 */
export const parseAthensWallClock = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const hour = m[4] !== undefined ? Number(m[4]) : 8;
    const minute = m[5] !== undefined ? Number(m[5]) : 0;
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const p = athensParts(utcGuess);
    const asAthensUtc = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour === '24' ? '0' : p.hour),
      Number(p.minute),
      0,
    );
    const offsetMs = asAthensUtc - utcGuess.getTime();
    return new Date(utcGuess.getTime() - offsetMs);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

/** "YYYY-MM-DDTHH:mm" in Europe/Athens time (never UTC, even in headless/UTC browsers). */
export const toLocalInputValue = (date: Date | string | undefined | null): string => {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date.trim())) {
    return date.trim();
  }
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const p = athensParts(d);
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hh}:${p.minute}`;
};

/** Next working day (Mon-Fri) at 08:00 Europe/Athens time, as "YYYY-MM-DDTHH:mm". */
export const nextWorkingDay0800 = (from: Date = new Date()): string => {
  const p = athensParts(from);
  const cursor = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 12));
  do {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  } while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6);
  return `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}T08:00`;
};

/** Today, next full hour (Europe/Athens), as "YYYY-MM-DDTHH:mm". */
export const todayNextHour = (): string => {
  const p = athensParts(new Date());
  const currentHour = Number(p.hour === '24' ? '0' : p.hour);
  const nextH = Math.min(currentHour + 1, 23);
  return `${p.year}-${p.month}-${p.day}T${pad(nextH)}:00`;
};

/**
 * Pre-filled next call for an outcome, the same on every screen (QA #82):
 * Call Back = today (next full hour); Interested / No Answer = next working day 08:00.
 */
export const defaultNextCallFor = (outcome?: string): string =>
  outcome === 'call_later' ? todayNextHour() : nextWorkingDay0800();

/** dd/mm/yyyy HH:mm in Europe/Athens. */
export const formatAthens = (date?: string | Date | null): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-GB', {
    timeZone: 'Europe/Athens',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');
};

/** dd/mm in Europe/Athens. */
export const formatAthensDayMonth = (date?: string | Date | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { timeZone: 'Europe/Athens', day: '2-digit', month: '2-digit' });
};

export interface TaskCallNote {
  at: string;
  by?: string | null;
  outcome?: string | null;
  note?: string;
  nextGoal?: string;
  nextCallAt?: string;
}

/** Previous call notes of a task, latest first. */
export const taskCallNotes = (task: any): TaskCallNote[] => {
  const notes = Array.isArray(task?.metadata?.callNotes) ? [...task.metadata.callNotes] : [];
  return notes.sort((a: TaskCallNote, b: TaskCallNote) => new Date(b.at).getTime() - new Date(a.at).getTime());
};
