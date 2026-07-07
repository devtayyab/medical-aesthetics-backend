// ─── Status Config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  ARRIVED: {
    label: 'Arrived',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-indigo-50',
    border: 'border-indigo-500',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-purple-50',
    border: 'border-purple-600',
    text: 'text-purple-700',
    dot: 'bg-purple-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  NO_SHOW: {
    label: 'No Show',
    bg: 'bg-gray-100',
    border: 'border-gray-400',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  EXECUTED: {
    label: 'Executed',
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  UNPAID: { label: 'Unpaid', bg: 'bg-red-100', text: 'text-red-700' },
  PAID: { label: 'Paid', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  PARTIALLY_PAID: { label: 'Partial', bg: 'bg-amber-100', text: 'text-amber-700' },
};

// ─── Time Slot Config ─────────────────────────────────────────────────────────

/** Height in px for one hour block */
export const HOUR_HEIGHT_PX = 64;

/** Default time slot interval in minutes */
export const SLOT_INTERVAL_MIN = 30;

/** Start and end hours shown on the grid */
export const GRID_START_HOUR = 0;
export const GRID_END_HOUR = 24;

// ─── Appointment Status Options ────────────────────────────────────────────────

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

// ─── Time Slot Options ────────────────────────────────────────────────────────

export const TIME_OPTIONS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4);
  const min = (i % 4) * 15;
  const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  
  return { value: timeStr, label: timeStr };
});

// ─── Duration Options ─────────────────────────────────────────────────────────

export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

// ─── Block Reason Options ─────────────────────────────────────────────────────

export const BLOCK_REASON_OPTIONS = [
  { value: 'LUNCH_BREAK', label: 'Lunch Break' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'OTHER', label: 'Other' },
];

// ─── Provider Colors (for multi-resource view) ─────────────────────────────

export const PROVIDER_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', dot: 'bg-teal-500' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-300', dot: 'bg-fuchsia-500' },
  { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300', dot: 'bg-lime-500' },
  { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300', dot: 'bg-sky-500' },
];
