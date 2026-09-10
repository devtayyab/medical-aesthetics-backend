import React, { useMemo } from 'react';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronRight, User
} from 'lucide-react';
import type { CalendarAppointment, ProviderResource } from './types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStatusStyle(apt: CalendarAppointment): {
  dot: string; row: string; badge: string; label: string; icon: React.ReactNode;
} {
  const status = apt.status?.toUpperCase();
  const isPaid = apt.computedPaymentStatus === 'PAID';

  if (status === 'NO_SHOW') {
    return {
      dot: 'bg-red-500',
      row: 'bg-red-50 hover:bg-red-100 border-l-4 border-red-400',
      badge: 'bg-red-100 text-red-700',
      label: 'No Show',
      icon: <XCircle className="w-3 h-3" />,
    };
  }
  if (status === 'CANCELLED') {
    return {
      dot: 'bg-gray-400',
      row: 'bg-gray-50 hover:bg-gray-100 border-l-4 border-gray-300',
      badge: 'bg-gray-100 text-gray-600',
      label: 'Cancelled',
      icon: <XCircle className="w-3 h-3" />,
    };
  }
  if (status === 'COMPLETED' || status === 'EXECUTED') {
    return {
      dot: isPaid ? 'bg-emerald-500' : 'bg-emerald-300',
      row: 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-emerald-400',
      badge: isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600',
      label: isPaid ? 'Paid' : 'Completed',
      icon: <CheckCircle2 className="w-3 h-3" />,
    };
  }
  if (status === 'CONFIRMED' || status === 'PENDING' || status === 'ARRIVED') {
    return {
      dot: 'bg-yellow-400',
      row: 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-400',
      badge: 'bg-yellow-100 text-yellow-700',
      label: status === 'CONFIRMED' ? 'Upcoming' : status === 'ARRIVED' ? 'Arrived' : 'Pending',
      icon: <Clock className="w-3 h-3" />,
    };
  }
  return {
    dot: 'bg-blue-400',
    row: 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    label: status ?? 'Unknown',
    icon: <AlertTriangle className="w-3 h-3" />,
  };
}

function fmt(dateStr: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-GB', opts);
}
function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface MonthListViewProps {
  appointments: CalendarAppointment[];
  providers: ProviderResource[];
  selectedProviderId: string;
  onAppointmentEdit: (apt: CalendarAppointment) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const MonthListView: React.FC<MonthListViewProps> = ({
  appointments,
  providers,
  selectedProviderId,
  onAppointmentEdit,
}) => {
  const [collapsedMonths, setCollapsedMonths] = React.useState<Set<string>>(new Set());
  const [collapsedProviders, setCollapsedProviders] = React.useState<Set<string>>(new Set());

  const toggleMonth = (key: string) =>
    setCollapsedMonths(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const toggleProvider = (key: string) =>
    setCollapsedProviders(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const filtered = useMemo(() => {
    const list = selectedProviderId === 'all'
      ? appointments
      : appointments.filter(a => a.providerId === selectedProviderId || a.provider?.id === selectedProviderId);
    return [...list].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointments, selectedProviderId]);

  const grouped = useMemo(() => {
    const months = new Map<string, Map<string, CalendarAppointment[]>>();
    for (const apt of filtered) {
      const mKey = monthKey(apt.startTime);
      if (!months.has(mKey)) months.set(mKey, new Map());
      const provId = apt.providerId ?? apt.provider?.id ?? 'unknown';
      const monthMap = months.get(mKey)!;
      if (!monthMap.has(provId)) monthMap.set(provId, []);
      monthMap.get(provId)!.push(apt);
    }
    return months;
  }, [filtered]);

  const providerMap = useMemo(() => {
    const m = new Map<string, ProviderResource>();
    for (const p of providers) m.set(p.id, p);
    return m;
  }, [providers]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <AlertTriangle className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-semibold">No appointments found for this period.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-6">
      {[...grouped.entries()].map(([mKey, provMap]) => {
        const isMonthCollapsed = collapsedMonths.has(mKey);
        const totalInMonth = [...provMap.values()].flat().length;

        return (
          <div key={mKey} className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            {/* Month Header */}
            <button
              onClick={() => toggleMonth(mKey)}
              className="w-full flex items-center justify-between px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isMonthCollapsed
                  ? <ChevronRight className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-black uppercase tracking-widest">{monthLabel(mKey)}</span>
              </div>
              <span className="text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-full">
                {totalInMonth} appointment{totalInMonth !== 1 ? 's' : ''}
              </span>
            </button>

            {!isMonthCollapsed && (
              <div className="divide-y divide-slate-100">
                {[...provMap.entries()].map(([provId, apts]) => {
                  const prov = providerMap.get(provId);
                  const provName = prov?.name ?? (apts[0]?.provider
                    ? `${apts[0].provider.firstName ?? ''} ${apts[0].provider.lastName ?? ''}`.trim()
                    : 'Unknown Provider');
                  const initials = prov?.initials ?? provName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                  const provKey = `${mKey}-${provId}`;
                  const isProvCollapsed = collapsedProviders.has(provKey);

                  const paid = apts.filter(a => a.computedPaymentStatus === 'PAID').length;
                  const upcoming = apts.filter(a => ['CONFIRMED', 'PENDING', 'ARRIVED'].includes(a.status?.toUpperCase())).length;
                  const noShow = apts.filter(a => a.status?.toUpperCase() === 'NO_SHOW').length;

                  return (
                    <div key={provKey}>
                      {/* Provider Sub-header */}
                      <button
                        onClick={() => toggleProvider(provKey)}
                        className="w-full flex items-center justify-between px-5 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isProvCollapsed
                            ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#CBFF38] to-[#8fb800] flex items-center justify-center text-slate-900 text-[9px] font-black flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{provName}</span>
                          <span className="text-[10px] text-slate-400">· {apts.length} appt{apts.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {paid > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5" />{paid} paid
                            </span>
                          )}
                          {upcoming > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-bold">
                              <Clock className="w-2.5 h-2.5" />{upcoming} upcoming
                            </span>
                          )}
                          {noShow > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-bold">
                              <XCircle className="w-2.5 h-2.5" />{noShow} no-show
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Appointment Rows */}
                      {!isProvCollapsed && (
                        <div>
                          {/* Column Headers */}
                          <div className="grid grid-cols-[90px_1fr_130px_100px_100px] gap-3 px-5 py-1.5 bg-slate-50 border-b border-slate-100">
                            {['Date', 'Patient / Service', 'Clinic', 'Time', 'Status'].map(h => (
                              <span key={h} className="text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</span>
                            ))}
                          </div>

                          {apts.map(apt => {
                            const style = getStatusStyle(apt);
                            const clientName = apt.client
                              ? `${apt.client.firstName ?? ''} ${apt.client.lastName ?? ''}`.trim()
                              : apt.clientName ?? 'Guest';
                            const serviceName = apt.service?.treatment?.name ?? apt.serviceName ?? 'Treatment';
                            const clinicName = apt.clinic?.name ?? apt.clinicName ?? '—';

                            return (
                              <button
                                key={apt.id}
                                onClick={() => onAppointmentEdit(apt)}
                                className={`w-full grid grid-cols-[90px_1fr_130px_100px_100px] gap-3 px-5 py-3 text-left transition-all ${style.row}`}
                              >
                                {/* Date */}
                                <div className="flex flex-col justify-center">
                                  <span className="text-xs font-black text-slate-800">
                                    {fmt(apt.startTime, { day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {fmt(apt.startTime, { weekday: 'short' })}
                                  </span>
                                </div>

                                {/* Patient / Service */}
                                <div className="flex flex-col justify-center min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="text-xs font-bold text-slate-800 truncate">{clientName}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 truncate pl-4">{serviceName}</span>
                                </div>

                                {/* Clinic */}
                                <div className="flex items-center min-w-0">
                                  <span className="text-[10px] text-slate-500 truncate">{clinicName}</span>
                                </div>

                                {/* Time */}
                                <div className="flex flex-col justify-center">
                                  <span className="text-xs font-semibold text-slate-700">{fmtTime(apt.startTime)}</span>
                                  <span className="text-[9px] text-slate-400">{fmtTime(apt.endTime)}</span>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${style.badge}`}>
                                    {style.icon}
                                    {style.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
