import type React from 'react';
import type { CalendarAppointment, SalesPersonResource } from './types';

// ─── Rows (week view) / columns (day view) ────────────────────────────────────
// One per salesperson, then "App / Without Salesperson", then "Clinic".

export const APP_ROW_KEY = '__app__';
export const CLINIC_ROW_KEY = '__clinic__';

export interface CalendarRow {
  key: string;
  label: string;
  kind: 'salesperson' | 'app' | 'clinic';
  /** Set only for salesperson rows. */
  salesPersonId?: string;
}

export const buildCalendarRows = (
  salespersons: SalesPersonResource[],
  selectedSalesPersonId: string,
): CalendarRow[] => {
  const salesRows: CalendarRow[] = salespersons.map(sp => ({
    key: sp.id,
    label: sp.name || 'Salesperson',
    kind: 'salesperson',
    salesPersonId: sp.id,
  }));
  // A salesperson picked in the sidebar / filters narrows the view to that row.
  if (selectedSalesPersonId && selectedSalesPersonId !== 'all') {
    const only = salesRows.filter(r => r.key === selectedSalesPersonId);
    if (only.length > 0) return only;
  }
  return [
    ...salesRows,
    { key: APP_ROW_KEY, label: 'App / Without Salesperson', kind: 'app' },
    { key: CLINIC_ROW_KEY, label: 'Clinic', kind: 'clinic' },
  ];
};

/** The clinic's own customer: shown as a dashed "Busy" card, never with the name. */
export const isBusyCard = (apt: CalendarAppointment): boolean =>
  Boolean(apt.isMaskedPrivate || apt.isClinicPrivate);

/** Row an appointment belongs to: its salesperson, else Clinic, else App. */
export const rowKeyForAppointment = (apt: CalendarAppointment, salespersonIds: Set<string>): string => {
  if (apt.isClinicPrivate) return CLINIC_ROW_KEY;
  const owner = [
    apt.ownerSalespersonId,
    apt.representativeId,
    apt.representative?.id,
    apt.bookedById,
    apt.bookedBy?.id,
  ].find(id => id && salespersonIds.has(id));
  if (owner) return owner;
  if (apt.calendarRow === 'clinic') return CLINIC_ROW_KEY;
  if (apt.calendarRow === 'app') return APP_ROW_KEY;
  // Older API responses carry no row: a masked appointment is a clinic one.
  return apt.isMaskedPrivate ? CLINIC_ROW_KEY : APP_ROW_KEY;
};

// ─── Card colours = appointment status ────────────────────────────────────────

export interface CardStyle {
  key: 'unconfirmed' | 'confirmed' | 'completed' | 'noShow' | 'cancelled' | 'busy';
  label: string;
  bg: string;
  border: string;
  text: string;
  dashed?: boolean;
  strike?: boolean;
}

export const CARD_STYLES: Record<CardStyle['key'], CardStyle> = {
  unconfirmed: { key: 'unconfirmed', label: 'Unconfirmed', bg: '#FEF08A', border: '#EAB308', text: '#713F12' },
  confirmed: { key: 'confirmed', label: 'Confirmed', bg: '#BAE6FD', border: '#38BDF8', text: '#0C4A6E' },
  completed: { key: 'completed', label: 'Completed / Paid', bg: '#D1D5DB', border: '#9CA3AF', text: '#1F2937' },
  noShow: { key: 'noShow', label: 'No-show', bg: '#FECACA', border: '#EF4444', text: '#7F1D1D' },
  cancelled: { key: 'cancelled', label: 'Cancelled', bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', strike: true },
  busy: { key: 'busy', label: 'Busy (clinic)', bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280', dashed: true },
};

/** Shown in the legend above the calendar, in this order. */
export const LEGEND_STYLES: CardStyle[] = [
  CARD_STYLES.unconfirmed,
  CARD_STYLES.confirmed,
  CARD_STYLES.completed,
  CARD_STYLES.noShow,
  CARD_STYLES.busy,
];

export const cardStyleFor = (apt: CalendarAppointment): CardStyle => {
  if (isBusyCard(apt)) return CARD_STYLES.busy;
  switch (String(apt.status || 'PENDING').toUpperCase()) {
    case 'CONFIRMED':
    case 'ARRIVED':
    case 'IN_PROGRESS':
      return CARD_STYLES.confirmed;
    case 'COMPLETED':
    case 'EXECUTED':
      return CARD_STYLES.completed;
    case 'NO_SHOW':
      return CARD_STYLES.noShow;
    case 'CANCELLED':
      return CARD_STYLES.cancelled;
    default:
      return CARD_STYLES.unconfirmed;
  }
};

/** Subtle grey stripes for blocked time and closed days; sits behind the appointments. */
export const STRIPED_BACKGROUND: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(100,116,139,0.16) 0px, rgba(100,116,139,0.16) 6px, transparent 6px, transparent 12px)',
};

export const appointmentClientName = (apt: CalendarAppointment): string => {
  if (isBusyCard(apt)) return 'Busy';
  if (apt.client?.firstName) return `${apt.client.firstName} ${apt.client.lastName || ''}`.trim();
  return apt.clientDetails?.fullName || 'Unknown';
};

export const pad2 = (n: number): string => n.toString().padStart(2, '0');
