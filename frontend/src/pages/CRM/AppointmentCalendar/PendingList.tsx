import React from 'react';
import { Clock, CheckCircle2, Building2, Phone } from 'lucide-react';
import type { CalendarAppointment } from './types';

interface PendingListProps {
  appointments: CalendarAppointment[];
  isLoading: boolean;
  confirmingId: string | null;
  onOpen: (apt: CalendarAppointment) => void;
  onConfirm: (apt: CalendarAppointment) => void;
}

const fmt = (value: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleString('el-GR', { timeZone: 'Europe/Athens', hour12: false, ...opts });

const clientName = (apt: CalendarAppointment) =>
  apt.displayName ||
  `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`.trim() ||
  apt.clientDetails?.fullName ||
  'Client';

const treatmentName = (apt: CalendarAppointment) =>
  apt.serviceName || apt.service?.treatment?.name || apt.service?.name || '-';

/**
 * "Pending Only (PENDING)": every appointment awaiting confirmation, across all clinics
 * and dates, so an admin sees at a glance what still has to be confirmed.
 */
export const PendingList: React.FC<PendingListProps> = ({ appointments, isLoading, confirmingId, onOpen, onConfirm }) => {
  const isGreek = typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el';
  const now = Date.now();
  // Upcoming first (soonest on top), then the ones whose time has already passed.
  const sorted = [...appointments].sort((a, b) => {
    const ta = new Date(a.startTime).getTime();
    const tb = new Date(b.startTime).getTime();
    const pa = ta < now;
    const pb = tb < now;
    if (pa !== pb) return pa ? 1 : -1;
    return pa ? tb - ta : ta - tb;
  });

  if (isLoading && sorted.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-[12px] font-bold text-slate-400">Loading...</div>;
  }

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        <p className="text-[12px] font-bold">
          {isGreek ? 'Δεν υπάρχουν ραντεβού σε αναμονή επιβεβαίωσης.' : 'No appointments are awaiting confirmation.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
      {sorted.map(apt => {
        const isPast = new Date(apt.startTime).getTime() < now;
        const phone = apt.client?.phone || apt.clientDetails?.phone || '';
        return (
          <div
            key={apt.id}
            onClick={() => onOpen(apt)}
            className="flex items-center gap-4 px-4 py-3 bg-white border border-orange-200 rounded-xl hover:border-orange-400 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="w-24 flex-shrink-0">
              <p className="text-[12px] font-black text-slate-800">
                {fmt(apt.startTime, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-[11px] font-bold text-orange-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {fmt(apt.startTime, { hour: '2-digit', minute: '2-digit' })}
              </p>
              {isPast && (
                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-black uppercase">
                  {isGreek ? 'Παρήλθε' : 'Past'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900 truncate">{clientName(apt)}</p>
              <p className="text-[11px] font-semibold text-slate-500 truncate">{treatmentName(apt)}</p>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  {apt.clinic?.name || '-'}
                </span>
                {phone && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Phone className="w-3 h-3" />
                    {phone}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                onConfirm(apt);
              }}
              disabled={confirmingId === apt.id}
              className="h-9 px-4 flex-shrink-0 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wide hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isGreek ? 'Επιβεβαίωση' : 'Confirm'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
