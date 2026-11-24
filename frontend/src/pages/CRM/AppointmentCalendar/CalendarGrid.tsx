import { confirmDialog } from '@/components/molecules/ConfirmDialog';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay } from 'date-fns';
import { Trash2, Lock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/services/api';
import { HOUR_HEIGHT_PX, SLOT_INTERVAL_MIN } from './constants';
import { AppointmentCard, AppointmentPopover } from './AppointmentCard';
import { getClinicLocalDate, getClinicLocalTime } from './useCalendarData';
import { CLINIC_ROW_KEY, STRIPED_BACKGROUND, buildCalendarRows, pad2, rowKeyForAppointment } from './calendarRows';
import type { CalendarRow } from './calendarRows';
import type { CalendarView, CalendarAppointment, SlotClickPayload, SalesPersonResource } from './types';

const getFormattedDay = (date: Date, fmt: string = 'EEE') => {
  const lang = localStorage.getItem('preferredLang') || 'en';
  if (lang === 'el') {
    if (fmt === 'EEE') {
      return ['ΚΥΡ', 'ΔΕΥ', 'ΤΡΙ', 'ΤΕΤ', 'ΠΕΜ', 'ΠΑΡ', 'ΣΑΒ'][date.getDay()];
    }
    if (fmt === 'EEEE, MMM d') {
      const elDays = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
      const elMonths = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
      return `${elDays[date.getDay()]}, ${elMonths[date.getMonth()]} ${date.getDate()}`;
    }
  }
  return format(date, fmt);
};

interface CalendarGridProps {
  viewDate: Date;
  viewMode: CalendarView;
  appointments: CalendarAppointment[];
  blockedSlots: any[];
  salespersons: SalesPersonResource[];
  selectedSalesPersonId: string;
  clinics: any[];
  selectedClinicId: string;
  clinicTimezone?: string;
  /** Which popover action is in flight, to disable its buttons. */
  busyAction?: 'confirm' | 'cancel' | null;
  onSlotClick: (payload: SlotClickPayload) => void;
  onAppointmentEdit: (apt: CalendarAppointment) => void;
  onAppointmentConfirm: (apt: CalendarAppointment) => Promise<void> | void;
  onAppointmentCancel: (apt: CalendarAppointment) => Promise<void> | void;
  onRefresh: () => void;
}

const TOTAL_HOURS = 24;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => i);
const GRID_TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT_PX;
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
/** Time prefilled when a week-view cell (which has no time axis) is clicked. */
const WEEK_CELL_DEFAULT_TIME = '10:00';
const ROW_LABEL_WIDTH = 132;

interface DayBlock {
  slot: any;
  startMin: number;
  endMin: number;
  isFullDay: boolean;
  label: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  viewDate,
  viewMode,
  appointments,
  blockedSlots,
  salespersons,
  selectedSalesPersonId,
  clinics,
  selectedClinicId,
  clinicTimezone,
  busyAction,
  onSlotClick,
  onAppointmentEdit,
  onAppointmentConfirm,
  onAppointmentCancel,
  onRefresh,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimeTop, setCurrentTimeTop] = useState(0);
  const [currentTimeLabel, setCurrentTimeLabel] = useState('');
  const [popover, setPopover] = useState<{ id: string; anchor: DOMRect } | null>(null);

  const days = useMemo(() => {
    if (viewMode === 'day') return [startOfDay(viewDate)];
    return eachDayOfInterval({
      start: startOfWeek(viewDate, { weekStartsOn: 1 }),
      end: endOfWeek(viewDate, { weekStartsOn: 1 }),
    });
  }, [viewDate, viewMode]);

  // ── Rows (week) / columns (day): salespeople, App, Clinic ────────────────────
  const rows = useMemo(
    () => buildCalendarRows(salespersons, selectedSalesPersonId),
    [salespersons, selectedSalesPersonId],
  );
  const salespersonIds = useMemo(() => new Set(salespersons.map(sp => sp.id)), [salespersons]);
  const salespersonNames = useMemo(() => new Map(salespersons.map(sp => [sp.id, sp.name])), [salespersons]);

  const getAptTimezone = useCallback(
    (apt: any): string => {
      const clinic = clinics.find(c => c.id === apt.clinicId);
      return apt.clinic?.timezone || clinic?.timezone || 'Europe/Athens';
    },
    [clinics],
  );

  /** appointments grouped as `${yyyy-MM-dd}|${rowKey}`, each list sorted by start time */
  const aptsByCell = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const apt of appointments) {
      const key = `${getClinicLocalDate(apt.startTime, getAptTimezone(apt))}|${rowKeyForAppointment(apt, salespersonIds)}`;
      const list = map.get(key);
      if (list) list.push(apt);
      else map.set(key, [apt]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return map;
  }, [appointments, salespersonIds, getAptTimezone]);

  const cellApts = (day: Date, rowKey: string): CalendarAppointment[] =>
    aptsByCell.get(`${format(day, 'yyyy-MM-dd')}|${rowKey}`) || [];

  // ── Blocked time and closed days ─────────────────────────────────────────────
  const blocksByDay = useMemo(() => {
    const map = new Map<string, DayBlock[]>();
    for (const slot of blockedSlots) {
      const clinic = clinics.find(c => c.id === slot.clinicId);
      const tz = clinic?.timezone || 'Europe/Athens';
      const start = getClinicLocalTime(slot.startTime, tz);
      const end = getClinicLocalTime(slot.endTime, tz);
      const startMin = start.hour * 60 + start.minute;
      let endMin = end.hour * 60 + end.minute;
      if (endMin <= startMin) endMin = 24 * 60; // ends at (or after) midnight
      const isFullDay = startMin === 0 && endMin >= 1380;
      const time = isFullDay ? 'All day' : `${pad2(start.hour)}:${pad2(start.minute)}–${pad2(end.hour)}:${pad2(end.minute)}`;
      const clinicLabel = selectedClinicId === 'all' && clinic?.name ? ` · ${clinic.name}` : '';
      const dayKey = getClinicLocalDate(slot.startTime, tz);
      const block: DayBlock = { slot, startMin, endMin, isFullDay, label: `${time}${clinicLabel}` };
      const list = map.get(dayKey);
      if (list) list.push(block);
      else map.set(dayKey, [block]);
    }
    return map;
  }, [blockedSlots, clinics, selectedClinicId]);

  const dayBlocks = (day: Date): DayBlock[] => blocksByDay.get(format(day, 'yyyy-MM-dd')) || [];

  /** Whole day unavailable. Only meaningful for one clinic: "All Clinics" never closes a day. */
  const isClosedDay = (day: Date): boolean => {
    if (selectedClinicId === 'all') return false;
    const clinic = clinics.find(c => c.id === selectedClinicId);
    const hours = clinic?.businessHours?.[WEEKDAY_KEYS[day.getDay()]];
    if (hours && hours.isOpen === false) return true;
    return dayBlocks(day).some(b => b.isFullDay && !b.slot.providerId);
  };

  const handleUnblock = async (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    if (!(await confirmDialog({ message: 'Remove this blocked time?', danger: true }))) return;
    try {
      await adminAPI.unblockSlot(slotId);
      toast.success('Slot unblocked!');
      onRefresh();
    } catch {
      toast.error('Failed to unblock slot.');
    }
  };

  // ── Current time line (day view), in the clinic timezone ─────────────────────
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let h = now.getHours();
      let m = now.getMinutes();
      const tz = clinicTimezone && clinicTimezone !== 'null' ? clinicTimezone : undefined;
      if (tz) {
        try {
          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23',
          }).formatToParts(now);
          const ph = parseInt(parts.find(p => p.type === 'hour')?.value ?? '', 10);
          const pm = parseInt(parts.find(p => p.type === 'minute')?.value ?? '', 10);
          if (!isNaN(ph) && !isNaN(pm)) {
            h = ph;
            m = pm;
          }
        } catch {
          // keep browser-local time
        }
      }
      setCurrentTimeTop(((h * 60 + m) / 60) * HOUR_HEIGHT_PX);
      setCurrentTimeLabel(`${pad2(h)}:${pad2(m)}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [clinicTimezone]);

  // Day view opens around the current hour (or 08:00 outside working hours)
  useEffect(() => {
    if (viewMode !== 'day') return;
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const currentHour = new Date().getHours();
      const target = currentHour >= 8 && currentHour <= 20 ? Math.max(0, (currentHour - 1) * HOUR_HEIGHT_PX) : 8 * HOUR_HEIGHT_PX;
      scrollContainerRef.current.scrollTop = target;
    }, 120);
    return () => clearTimeout(timer);
  }, [viewDate, viewMode]);

  // ── Overlap lanes inside one day-view column ─────────────────────────────────
  const computeLanes = (apts: CalendarAppointment[]): Map<string, { lane: number; total: number }> => {
    const sorted = [...apts].sort((a, b) => {
      const diff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (diff !== 0) return diff;
      return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
    });
    const lanes: number[] = [];
    const aptLane = new Map<string, number>();
    for (const apt of sorted) {
      const start = new Date(apt.startTime).getTime();
      let assigned = lanes.findIndex(end => end <= start);
      if (assigned === -1) {
        assigned = lanes.length;
        lanes.push(0);
      }
      lanes[assigned] = new Date(apt.endTime).getTime();
      aptLane.set(apt.id, assigned);
    }
    const result = new Map<string, { lane: number; total: number }>();
    for (const apt of apts) {
      const aptStart = new Date(apt.startTime).getTime();
      const aptEnd = new Date(apt.endTime).getTime();
      let maxLane = aptLane.get(apt.id)!;
      for (const other of apts) {
        if (other.id === apt.id) continue;
        const os = new Date(other.startTime).getTime();
        const oe = new Date(other.endTime).getTime();
        if (aptStart < oe && aptEnd > os) maxLane = Math.max(maxLane, aptLane.get(other.id)!);
      }
      result.set(apt.id, { lane: aptLane.get(apt.id)!, total: maxLane + 1 });
    }
    return result;
  };

  // ── Popover ──────────────────────────────────────────────────────────────────
  const openPopover = useCallback((apt: CalendarAppointment, anchor: DOMRect) => {
    setPopover({ id: apt.id, anchor });
  }, []);
  const closePopover = useCallback(() => setPopover(null), []);
  // Always the fresh copy, so the pop-up reflects a status change made from it.
  const popoverApt = popover ? appointments.find(a => a.id === popover.id) || null : null;

  const salespersonNameFor = (apt: CalendarAppointment): string => {
    const rowKey = rowKeyForAppointment(apt, salespersonIds);
    if (salespersonNames.has(rowKey)) return salespersonNames.get(rowKey) || '';
    if (apt.representative?.firstName) return `${apt.representative.firstName} ${apt.representative.lastName || ''}`.trim();
    if (apt.bookedByInfo?.name) return apt.bookedByInfo.name;
    return rowKey === CLINIC_ROW_KEY ? 'Clinic' : 'App / Without Salesperson';
  };

  const slotSalesPersonId = (row: CalendarRow): string => row.salesPersonId || '';

  // ── Responsive: agenda list on phones ────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const popoverNode = popover && popoverApt && (
    <AppointmentPopover
      appointment={popoverApt}
      anchor={popover.anchor}
      timezone={getAptTimezone(popoverApt)}
      salespersonName={salespersonNameFor(popoverApt)}
      busyAction={busyAction}
      onClose={closePopover}
      onConfirm={apt => onAppointmentConfirm(apt)}
      onReschedule={apt => {
        closePopover();
        onAppointmentEdit(apt);
      }}
      onCancel={async apt => {
        await onAppointmentCancel(apt);
        closePopover();
      }}
    />
  );

  if (isMobile) {
    return (
      <>
        <AgendaView appointments={appointments} days={days} getTimezone={getAptTimezone} onOpen={openPopover} />
        {popoverNode}
      </>
    );
  }

  const rowLabelCell = (row: CalendarRow) => (
    <span
      className={`text-[11px] font-black leading-tight notranslate ${
        row.kind === 'salesperson' ? 'text-slate-800' : 'text-slate-500'
      }`}
    >
      {row.label}
    </span>
  );

  // ════════════════════════════ WEEK: rows = salespeople, columns = days ═══════
  if (viewMode !== 'day') {
    const gridTemplateColumns = `${ROW_LABEL_WIDTH}px repeat(${days.length}, minmax(150px, 1fr))`;
    return (
      <div className="flex flex-col flex-1 min-h-0 h-full w-full relative overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <div className="grid min-w-max" style={{ gridTemplateColumns }}>
            {/* Header: days */}
            <div className="sticky top-0 left-0 z-30 bg-white border-b border-r border-slate-200" />
            {days.map(day => {
              const blocks = dayBlocks(day);
              const closed = isClosedDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`sticky top-0 z-20 border-b border-r border-slate-200 px-2 py-1.5 ${isToday(day) ? 'bg-indigo-50' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest notranslate ${isToday(day) ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {getFormattedDay(day, 'EEE')}
                    </span>
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-black ${
                        isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-800'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {closed && <span className="text-[9px] font-black uppercase text-slate-400">Closed</span>}
                  </div>
                  {/* Blocked time of this day: listed here so it never covers an appointment */}
                  {blocks.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {blocks.map(b => (
                        <div
                          key={b.slot.id}
                          className="group flex items-center gap-1 rounded px-1.5 py-0.5 bg-slate-50 border border-slate-200"
                          style={STRIPED_BACKGROUND}
                          title={b.slot.reason || 'Blocked'}
                        >
                          <Lock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                          <span className="text-[9px] font-bold text-slate-500 truncate flex-1">Blocked {b.label}</span>
                          <button
                            type="button"
                            onClick={e => handleUnblock(e, b.slot.id)}
                            aria-label="Remove blocked time"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* One row per salesperson, then App, then Clinic; grey divider between rows */}
            {rows.map((row, rowIdx) => {
              const divider = rowIdx < rows.length - 1 ? 'border-b-4 border-b-slate-200' : 'border-b border-b-slate-200';
              return (
                <React.Fragment key={row.key}>
                  <div className={`sticky left-0 z-10 bg-slate-50 border-r border-slate-200 px-3 py-2 flex items-start ${divider}`}>
                    {rowLabelCell(row)}
                  </div>
                  {days.map(day => {
                    const apts = cellApts(day, row.key);
                    const closed = isClosedDay(day);
                    return (
                      <div
                        key={`${row.key}-${day.toISOString()}`}
                        className={`group relative border-r border-slate-100 p-1 min-h-[76px] flex flex-col gap-1 cursor-pointer ${divider} ${
                          isToday(day) ? 'bg-indigo-50/20' : 'bg-white'
                        }`}
                        style={closed ? STRIPED_BACKGROUND : undefined}
                        onClick={() => onSlotClick({ date: day, timeStr: WEEK_CELL_DEFAULT_TIME, salesPersonId: slotSalesPersonId(row) })}
                      >
                        {apts.map(apt => (
                          <AppointmentCard key={apt.id} appointment={apt} timezone={getAptTimezone(apt)} onOpen={openPopover} />
                        ))}
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity self-center mt-auto text-slate-300">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        {popoverNode}
      </div>
    );
  }

  // ════════════════════════════ DAY: columns = salespeople, time on the left ═══
  const day = days[0];
  const dayIsToday = isToday(day);
  const closed = isClosedDay(day);
  const blocks = dayBlocks(day);

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, row: CalendarRow) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const totalMinutes = Math.floor(((e.clientY - rect.top) / HOUR_HEIGHT_PX) * 60);
    const snapped = Math.min(Math.round(totalMinutes / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN, 24 * 60 - SLOT_INTERVAL_MIN);
    onSlotClick({
      date: day,
      timeStr: `${pad2(Math.floor(snapped / 60))}:${pad2(snapped % 60)}`,
      salesPersonId: slotSalesPersonId(row),
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full relative overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div className="min-w-max">
          {/* Header: one column per salesperson */}
          <div className="flex sticky top-0 z-30 bg-white border-b border-slate-200">
            <div className="w-14 flex-shrink-0 border-r border-slate-200 sticky left-0 bg-white z-10" />
            {rows.map(row => (
              <div
                key={row.key}
                className="flex-1 min-w-[170px] border-r-4 border-r-slate-200 last:border-r px-2 py-2 flex items-center justify-center text-center bg-slate-50"
              >
                {rowLabelCell(row)}
                {closed && row === rows[0] && <span className="ml-2 text-[9px] font-black uppercase text-slate-400">Closed</span>}
              </div>
            ))}
          </div>

          <div className="flex" style={{ height: GRID_TOTAL_HEIGHT }}>
            {/* Time gutter */}
            <div className="w-14 flex-shrink-0 border-r border-slate-200 relative sticky left-0 bg-white z-20">
              {HOURS.map(hour => (
                <div key={hour} className="absolute w-full flex items-start justify-end pr-2" style={{ top: hour * HOUR_HEIGHT_PX - 7, height: HOUR_HEIGHT_PX }}>
                  <span className="text-[9px] font-bold text-slate-400 leading-none">{hour === 0 ? '' : `${pad2(hour)}:00`}</span>
                </div>
              ))}
              {dayIsToday && currentTimeLabel && (
                <div className="absolute right-0 z-40 pointer-events-none w-full flex justify-end pr-1" style={{ top: currentTimeTop - 9 }}>
                  <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md leading-none">{currentTimeLabel}</span>
                </div>
              )}
            </div>

            {rows.map(row => {
              const colApts = cellApts(day, row.key);
              const laneMap = computeLanes(colApts);
              // A block for one person shades only that column; a clinic block shades them all.
              const colBlocks = blocks.filter(b => !b.slot.providerId || !salespersonIds.has(b.slot.providerId) || b.slot.providerId === row.salesPersonId);
              return (
                <div
                  key={row.key}
                  className="flex-1 min-w-[170px] relative border-r-4 border-r-slate-200 last:border-r cursor-pointer"
                  style={{ height: GRID_TOTAL_HEIGHT, ...(closed ? STRIPED_BACKGROUND : {}) }}
                  onClick={e => handleColumnClick(e, row)}
                >
                  {HOURS.map(hour => (
                    <div key={hour} className="absolute w-full border-b border-slate-100 pointer-events-none" style={{ top: hour * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}>
                      <div className="absolute w-full border-b border-slate-50" style={{ top: HOUR_HEIGHT_PX / 2 }} />
                    </div>
                  ))}

                  {/* Blocked time: striped background BEHIND the appointments */}
                  {!closed &&
                    colBlocks.map(b => (
                      <div
                        key={b.slot.id}
                        className="group absolute left-0 right-0 z-0 pointer-events-none"
                        style={{
                          top: (b.startMin / 60) * HOUR_HEIGHT_PX,
                          height: Math.max(((b.endMin - b.startMin) / 60) * HOUR_HEIGHT_PX, 16),
                          ...STRIPED_BACKGROUND,
                        }}
                      >
                        <div className="absolute top-0.5 right-0.5 flex items-center gap-1 pointer-events-auto" onClick={e => e.stopPropagation()}>
                          <span className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-0.5" title={b.slot.reason || 'Blocked'}>
                            <Lock className="w-2.5 h-2.5" /> Blocked
                          </span>
                          <button
                            type="button"
                            onClick={e => handleUnblock(e, b.slot.id)}
                            aria-label="Remove blocked time"
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {dayIsToday && (
                    <div className="absolute left-0 right-0 z-30 pointer-events-none h-[2px] bg-red-400" style={{ top: currentTimeTop }} />
                  )}

                  {colApts.map(apt => {
                    const tz = getAptTimezone(apt);
                    const { hour, minute } = getClinicLocalTime(apt.startTime, tz);
                    const durationHours = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 3600000;
                    const { lane, total } = laneMap.get(apt.id) ?? { lane: 0, total: 1 };
                    const widthPct = 100 / total;
                    return (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        timezone={tz}
                        onOpen={openPopover}
                        style={{
                          position: 'absolute',
                          zIndex: 10,
                          top: (hour + minute / 60) * HOUR_HEIGHT_PX,
                          height: Math.max(durationHours * HOUR_HEIGHT_PX - 2, 22),
                          minHeight: 22,
                          left: `calc(${lane * widthPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          alignItems: 'flex-start',
                          paddingTop: 3,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {popoverNode}
    </div>
  );
};

// ── Agenda View (Mobile) ───────────────────────────────────────────────────────

interface AgendaViewProps {
  appointments: CalendarAppointment[];
  days: Date[];
  getTimezone: (apt: CalendarAppointment) => string;
  onOpen: (apt: CalendarAppointment, anchor: DOMRect) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ appointments, days, getTimezone, onOpen }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {days.map(day => {
      // Bucket by clinic-local date, so mobile and desktop agree on which day a card is on.
      const dayApts = appointments
        .filter(apt => getClinicLocalDate(apt.startTime, getTimezone(apt)) === format(day, 'yyyy-MM-dd'))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return (
        <div key={day.toISOString()}>
          <div className={`flex items-center gap-2 mb-2 ${isToday(day) ? 'text-indigo-600' : 'text-slate-500'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                isToday(day) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {format(day, 'd')}
            </div>
            <span className="text-[11px] font-black uppercase tracking-wide notranslate">{getFormattedDay(day, 'EEEE, MMM d')}</span>
          </div>

          {dayApts.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic ml-10">No appointments</p>
          ) : (
            <div className="space-y-1.5 ml-10">
              {dayApts.map(apt => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  timezone={getTimezone(apt)}
                  onOpen={onOpen}
                  style={{ minHeight: 36 }}
                />
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);
