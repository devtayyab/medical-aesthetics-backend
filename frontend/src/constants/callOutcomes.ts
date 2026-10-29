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

/** "YYYY-MM-DDTHH:mm" in browser local time (staff browsers run in Europe/Athens). */
export const toLocalInputValue = (date: Date | string | undefined | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Next working day (Mon-Fri) at 08:00 local time, as "YYYY-MM-DDTHH:mm". */
export const nextWorkingDay0800 = (from: Date = new Date()): string => {
  const d = new Date(from);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  d.setHours(8, 0, 0, 0);
  return toLocalInputValue(d);
};

/** Today, next full hour (local), as "YYYY-MM-DDTHH:mm". */
export const todayNextHour = (): string => {
  const d = new Date();
  d.setHours(Math.min(d.getHours() + 1, 23), 0, 0, 0);
  return toLocalInputValue(d);
};

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
