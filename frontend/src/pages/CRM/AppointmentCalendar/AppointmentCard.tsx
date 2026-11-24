import React, { useEffect } from 'react';
import { Clock, Phone, Building2, User, Sparkles, StickyNote, X, Check, CalendarClock, Ban } from 'lucide-react';
import { STATUS_CONFIG } from './constants';
import { getClinicLocalTime, getClinicLocalDate } from './useCalendarData';
import { appointmentClientName, cardStyleFor, isBusyCard, pad2 } from './calendarRows';
import type { CalendarAppointment } from './types';

const timeLabel = (iso: string, timezone: string): string => {
  const { hour, minute } = getClinicLocalTime(iso, timezone);
  return `${pad2(hour)}:${pad2(minute)}`;
};

// ─── Card: one line, time + customer name ─────────────────────────────────────

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  timezone: string;
  /** Absolute position inside the day-view time grid; omit for the stacked week view. */
  style?: React.CSSProperties;
  onOpen: (apt: CalendarAppointment, anchor: DOMRect) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment: apt, timezone, style, onOpen }) => {
  const cfg = cardStyleFor(apt);
  const name = appointmentClientName(apt);
  const start = timeLabel(apt.startTime, timezone);

  return (
    <button
      type="button"
      title={`${start} ${name}`}
      onClick={e => {
        e.stopPropagation();
        onOpen(apt, e.currentTarget.getBoundingClientRect());
      }}
      className="w-full flex items-center gap-1.5 px-2 rounded-md text-left overflow-hidden transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
      style={{
        minHeight: 24,
        background: cfg.bg,
        color: cfg.text,
        border: `1px ${cfg.dashed ? 'dashed' : 'solid'} ${cfg.border}`,
        ...style,
      }}
    >
      <span className="text-[11px] font-bold tabular-nums flex-shrink-0">{start}</span>
      <span className={`text-[12px] font-semibold truncate notranslate ${cfg.strike ? 'line-through' : ''}`}>
        {name}
      </span>
    </button>
  );
};

// ─── Details pop-up (opens on click) ──────────────────────────────────────────

interface AppointmentPopoverProps {
  appointment: CalendarAppointment;
  anchor: DOMRect;
  timezone: string;
  salespersonName: string;
  busyAction?: 'confirm' | 'cancel' | null;
  onClose: () => void;
  onConfirm: (apt: CalendarAppointment) => void;
  onReschedule: (apt: CalendarAppointment) => void;
  onCancel: (apt: CalendarAppointment) => void;
}

const POPOVER_WIDTH = 320;
const POPOVER_MAX_HEIGHT = 440;

export const AppointmentPopover: React.FC<AppointmentPopoverProps> = ({
  appointment: apt,
  anchor,
  timezone,
  salespersonName,
  busyAction,
  onClose,
  onConfirm,
  onReschedule,
  onCancel,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cfg = cardStyleFor(apt);
  const masked = Boolean(apt.isMaskedPrivate);
  const status = String(apt.status || 'PENDING').toUpperCase();
  const statusLabel = isBusyCard(apt) && masked ? 'Busy' : STATUS_CONFIG[status]?.label || cfg.label;

  const name = masked ? 'Busy' : apt.client?.firstName
    ? `${apt.client.firstName} ${apt.client.lastName || ''}`.trim()
    : apt.clientDetails?.fullName || 'Unknown';
  const treatment =
    apt.treatmentLabel ||
    [apt.serviceName || apt.service?.treatment?.name || apt.service?.name, ...(apt.additionalServices || []).map((s: any) => s?.name)]
      .filter(Boolean)
      .join(' + ');
  const clinicName = apt.clinic?.name || apt.clinicName || '';
  const phone = apt.client?.phone || apt.clientDetails?.phone || '';
  const notes = String(apt.notes || '').trim();
  const dateStr = getClinicLocalDate(apt.startTime, timezone).split('-').reverse().join('/');

  const canConfirm = !masked && status === 'PENDING';
  const canChange = !masked && !['CANCELLED', 'COMPLETED', 'EXECUTED', 'NO_SHOW'].includes(status);

  // Next to the card: right side when there is room, otherwise left; always inside the window.
  const spaceRight = window.innerWidth - anchor.right;
  const left =
    spaceRight > POPOVER_WIDTH + 16
      ? anchor.right + 8
      : Math.max(8, Math.min(anchor.left - POPOVER_WIDTH - 8, window.innerWidth - POPOVER_WIDTH - 8));
  const top = Math.max(8, Math.min(anchor.top, window.innerHeight - POPOVER_MAX_HEIGHT - 8));

  return (
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        className="fixed z-[999] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden flex flex-col"
        style={{ left, top, width: POPOVER_WIDTH, maxHeight: POPOVER_MAX_HEIGHT }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-start justify-between gap-2" style={{ background: cfg.bg, borderBottom: `2px solid ${cfg.border}` }}>
          <div className="min-w-0">
            <p className={`text-[14px] font-black leading-tight truncate notranslate ${cfg.strike ? 'line-through' : ''}`} style={{ color: cfg.text }}>
              {name}
            </p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: cfg.text }}>
              {dateStr} · {timeLabel(apt.startTime, timezone)}–{timeLabel(apt.endTime, timezone)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/80" style={{ color: cfg.text }}>
              {statusLabel}
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/10" style={{ color: cfg.text }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 py-3 flex flex-col gap-2.5 overflow-y-auto">
          {masked ? (
            <p className="text-[12px] text-slate-500">
              Clinic appointment. This time is taken{clinicName ? ` at ${clinicName}` : ''}.
            </p>
          ) : (
            <>
              <DetailRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Treatment" value={treatment || '-'} />
              <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Clinic" value={clinicName || '-'} />
              <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Salesperson" value={salespersonName || '-'} />
              <DetailRow
                icon={<Phone className="w-3.5 h-3.5" />}
                label="Phone"
                value={phone ? <a href={`tel:${phone}`} className="text-indigo-600 hover:underline">{phone}</a> : '-'}
              />
              <DetailRow icon={<StickyNote className="w-3.5 h-3.5" />} label="Notes" value={notes || '-'} multiline />
            </>
          )}
        </div>

        {/* Actions */}
        {!masked && (
          <div className="px-4 py-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <ActionButton
                label={busyAction === 'confirm' ? '...' : 'Confirm'}
                icon={<Check className="w-3.5 h-3.5" />}
                disabled={!canConfirm || !!busyAction}
                className="bg-sky-600 text-white hover:bg-sky-700"
                onClick={() => onConfirm(apt)}
              />
              <ActionButton
                label="Reschedule"
                icon={<CalendarClock className="w-3.5 h-3.5" />}
                disabled={!canChange || !!busyAction}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => onReschedule(apt)}
              />
              <ActionButton
                label={busyAction === 'cancel' ? '...' : 'Cancel'}
                icon={<Ban className="w-3.5 h-3.5" />}
                disabled={!canChange || !!busyAction}
                className="bg-red-50 text-red-700 hover:bg-red-100"
                onClick={() => onCancel(apt)}
              />
            </div>
            <button
              type="button"
              onClick={() => onReschedule(apt)}
              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1"
            >
              <Clock className="w-3 h-3" /> Open full details
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; multiline?: boolean }> = ({
  icon,
  label,
  value,
  multiline,
}) => (
  <div className="flex items-start gap-2.5">
    <div className="w-6 h-6 rounded-md bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">{label}</p>
      <div className={`text-[12px] font-semibold text-slate-800 mt-1 notranslate ${multiline ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
        {value}
      </div>
    </div>
  </div>
);

const ActionButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  className: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, icon, className, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`h-9 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {icon}
    {label}
  </button>
);
