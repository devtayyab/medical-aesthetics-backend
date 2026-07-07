import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  format, isSameDay, isToday, startOfWeek, endOfWeek,
  eachDayOfInterval, startOfDay, parseISO,
} from 'date-fns';
import { Trash2, Lock } from 'lucide-react';
import { HOUR_HEIGHT_PX, SLOT_INTERVAL_MIN, STATUS_CONFIG } from './constants';
import { AppointmentCard } from './AppointmentCard';
import { getClinicLocalDate, getClinicLocalTime } from './useCalendarData';
import type { CalendarView, CalendarAppointment, SlotClickPayload, SalesPersonResource } from './types';
import toast from 'react-hot-toast';
import { adminAPI } from '@/services/api';

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
  onSlotClick: (payload: SlotClickPayload) => void;
  onAppointmentEdit: (apt: CalendarAppointment) => void;
  onRefresh: () => void;
}

const TOTAL_HOURS = 24;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => i);
const GRID_TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT_PX;

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  viewDate,
  viewMode,
  appointments,
  blockedSlots,
  salespersons: _salespersons,
  selectedSalesPersonId: _selectedSalesPersonId,
  clinics,
  selectedClinicId: _selectedClinicId,
  clinicTimezone,
  onSlotClick,
  onAppointmentEdit,
  onRefresh,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimeTop, setCurrentTimeTop] = useState(0);


  // Days to display
  const days = useMemo(() => {
    if (viewMode === 'day') return [startOfDay(viewDate)];
    return eachDayOfInterval({
      start: startOfWeek(viewDate, { weekStartsOn: 1 }),
      end: endOfWeek(viewDate, { weekStartsOn: 1 }),
    });
  }, [viewDate, viewMode]);

  // Current time line — use clinic timezone so the red line
  // aligns with appointment positions (which are also in clinic tz).
  useEffect(() => {
    const updateTime = () => {
      const nowIso = new Date().toISOString();
      const tz = clinicTimezone && clinicTimezone !== 'null' ? clinicTimezone : undefined;
      let minutes: number;
      if (tz) {
        try {
          const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23',
          });
          const parts = fmt.formatToParts(new Date(nowIso));
          const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
          const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
          minutes = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
        } catch {
          const now = new Date();
          minutes = now.getHours() * 60 + now.getMinutes();
        }
      } else {
        const now = new Date();
        minutes = now.getHours() * 60 + now.getMinutes();
      }
      setCurrentTimeTop((minutes / 60) * HOUR_HEIGHT_PX);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [clinicTimezone]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTarget = currentTimeTop - 120;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollTarget);
    }
  }, []);

  // Get timezone for an appointment
  const getAptTimezone = (apt: any): string => {
    const clinic = clinics.find(c => c.id === apt.clinicId);
    return apt.clinic?.timezone || clinic?.timezone || 'UTC';
  };

  // Filter appointments for a given day
  const getAptsByDay = (day: Date): CalendarAppointment[] => {
    return appointments.filter(apt => {
      const tz = getAptTimezone(apt);
      const aptDateStr = getClinicLocalDate(apt.startTime, tz);
      const dayDateStr = format(day, 'yyyy-MM-dd');
      return aptDateStr === dayDateStr;
    });
  };

  // Get blocked slots for a day
  // NOTE: getClinicLocalDate() already returns a 'yyyy-MM-dd' string — do NOT
  // wrap it in format() (which expects a Date object and would silently break).
  const getBlockedByDay = (day: Date): any[] => {
    const dayDateStr = format(day, 'yyyy-MM-dd');
    return blockedSlots.filter(slot => {
      const clinic = clinics.find(c => c.id === slot.clinicId);
      const tz = clinic?.timezone || 'UTC';
      const slotDateStr = getClinicLocalDate(slot.startTime, tz); // already a string
      return slotDateStr === dayDateStr;
    });
  };

  // Compute pixel position for an appointment
  const getAptStyle = (apt: CalendarAppointment, tz: string, allDayApts: CalendarAppointment[]): React.CSSProperties => {
    const { hour, minute } = getClinicLocalTime(apt.startTime, tz);
    const top = hour * HOUR_HEIGHT_PX + (minute / 60) * HOUR_HEIGHT_PX;
    const start = parseISO(apt.startTime);
    const end = parseISO(apt.endTime);
    const durationHours = (end.getTime() - start.getTime()) / 3600000;
    const height = Math.max(durationHours * HOUR_HEIGHT_PX, 20);

    // Detect overlaps and compute left/width
    const overlapping = allDayApts.filter(other => {
      if (other.id === apt.id) return false;
      const otherStart = new Date(other.startTime).getTime();
      const otherEnd = new Date(other.endTime).getTime();
      const aptStart = new Date(apt.startTime).getTime();
      const aptEnd = new Date(apt.endTime).getTime();
      return aptStart < otherEnd && aptEnd > otherStart;
    });

    const overlapCount = overlapping.length + 1;
    const aptIndex = allDayApts.filter(other => {
      if (other.id === apt.id) return false;
      const otherStart = new Date(other.startTime).getTime();
      const aptStart = new Date(apt.startTime).getTime();
      return otherStart <= aptStart;
    }).length;

    const widthPct = 100 / overlapCount;
    const leftPct = (aptIndex % overlapCount) * widthPct;

    return {
      position: 'absolute',
      top,
      height,
      left: `${leftPct + 2}%`,
      right: `${100 - leftPct - widthPct + 1}%`,
    };
  };

  // Unblock a slot
  const handleUnblock = async (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    if (!window.confirm('Remove this blocked time?')) return;
    try {
      await adminAPI.unblockSlot(slotId);
      toast.success('Slot unblocked!');
      onRefresh();
    } catch {
      toast.error('Failed to unblock slot.');
    }
  };

  // Day column click
  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, day: Date, dayApts: CalendarAppointment[]) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0);
    const totalMinutes = Math.floor((relativeY / HOUR_HEIGHT_PX) * 60);
    const snappedMinutes = Math.round(totalMinutes / SLOT_INTERVAL_MIN) * SLOT_INTERVAL_MIN;
    
    // Check if slot is booked
    const isBooked = dayApts.some(apt => {
      const tz = getAptTimezone(apt);
      const { hour: startHour, minute: startMin } = getClinicLocalTime(apt.startTime, tz);
      const { hour: endHour, minute: endMin } = getClinicLocalTime(apt.endTime, tz);
      
      const aptStartMins = startHour * 60 + startMin;
      const aptEndMins = endHour * 60 + endMin;
      
      return snappedMinutes >= aptStartMins && snappedMinutes < aptEndMins;
    });

    if (isBooked) {
       toast.error('This time slot is already booked.');
       return;
    }

    const hour = Math.floor(snappedMinutes / 60);
    const minute = snappedMinutes % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onSlotClick({ date: day, timeStr });
  };

  // Responsive: detect mobile
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mobile: agenda view
  if (isMobile) {
    return <AgendaView appointments={appointments} days={days} onEdit={onAppointmentEdit} />;
  }


  return (
    <div className="flex flex-col flex-1 h-full w-full relative overflow-hidden">
      {/* Day Header Row */}
      <div className="flex bg-white border-b border-slate-200 sticky top-0 z-10">
        {/* Time gutter */}
        <div className="w-14 flex-shrink-0 border-r border-slate-100" />
        {/* Day headers */}
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={`flex-1 border-r border-slate-100 py-2 flex flex-col items-center justify-center min-w-[80px] ${
              isToday(day) ? 'bg-indigo-50/50' : ''
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday(day) ? 'text-indigo-500' : 'text-slate-400'}`}>
              {format(day, 'EEE')}
            </span>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full mt-0.5 ${
              isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-800'
            }`}>
              <span className="text-base font-black">{format(day, 'd')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
        <div className="flex" style={{ height: GRID_TOTAL_HEIGHT }}>
          {/* Time Gutter */}
          <div className="w-14 flex-shrink-0 border-r border-slate-100 relative">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: hour * HOUR_HEIGHT_PX - 7, height: HOUR_HEIGHT_PX }}
              >
                <span className="text-[9px] font-bold text-slate-400 leading-none">
                  {hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((day) => {
            const dayApts = getAptsByDay(day);
            const dayBlocked = getBlockedByDay(day);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`flex-1 relative border-r border-slate-100 cursor-crosshair min-w-[80px] ${
                  isDayToday ? 'bg-indigo-50/10' : ''
                }`}
                style={{ height: GRID_TOTAL_HEIGHT }}
                onClick={e => handleColumnClick(e, day, dayApts)}
              >
                {/* Hour grid lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-b border-slate-100"
                    style={{ top: hour * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                  >
                    {/* 30-min tick */}
                    <div
                      className="absolute w-full border-b border-slate-50"
                      style={{ top: HOUR_HEIGHT_PX / 2 }}
                    />
                  </div>
                ))}

                {/* Current time line */}
                {isDayToday && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: currentTimeTop }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5 flex-shrink-0" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Blocked Slots */}
                {dayBlocked.map(slot => {
                  const clinic = clinics.find(c => c.id === slot.clinicId);
                  const tz = clinic?.timezone || 'UTC';
                  
                  const { hour: startHour, minute: startMinVal } = getClinicLocalTime(slot.startTime, tz);
                  const { hour: endHour, minute: endMinVal } = getClinicLocalTime(slot.endTime, tz);
                  
                  const startMin = startHour * 60 + startMinVal;
                  const endMin = endHour * 60 + endMinVal;
                  const top = (startMin / 60) * HOUR_HEIGHT_PX;
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT_PX, 20);
                  const isFullDay = startMin === 0 && endMin >= 1439;

                  return (
                    <div
                      key={slot.id}
                      className="absolute left-0 right-0 z-10 bg-red-500/10 border-2 border-dashed border-red-400 flex items-center justify-between px-2 overflow-hidden group"
                      style={{ top: isFullDay ? 0 : top, height: isFullDay ? '100%' : height }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <Lock className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
                        {height > 30 && (
                          <span className="text-[9px] font-bold text-red-700 uppercase truncate">
                            {slot.reason || 'Blocked'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={e => handleUnblock(e, slot.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-red-500" />
                      </button>
                    </div>
                  );
                })}

                {/* Appointments */}
                {dayApts.map(apt => {
                  const tz = getAptTimezone(apt);
                  const aptStyle = getAptStyle(apt, tz, dayApts);
                  return (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      style={aptStyle}
                      timezone={tz}
                      onEdit={onAppointmentEdit}
                      onDragStart={() => {}}
                      onResizeStart={() => {}}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Agenda View (Mobile) ───────────────────────────────────────────────────────

interface AgendaViewProps {
  appointments: CalendarAppointment[];
  days: Date[];
  onEdit: (apt: CalendarAppointment) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ appointments, days, onEdit }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {days.map(day => {
        const dayApts = appointments.filter(apt => {
          const aptDate = new Date(apt.startTime);
          return isSameDay(aptDate, day);
        });

        return (
          <div key={day.toISOString()}>
            <div className={`flex items-center gap-2 mb-2 ${isToday(day) ? 'text-indigo-600' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                isToday(day) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {format(day, 'd')}
              </div>
              <span className="text-[11px] font-black uppercase tracking-wide">
                {format(day, 'EEEE, MMM d')}
              </span>
            </div>

            {dayApts.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic ml-10">No appointments</p>
            ) : (
              <div className="space-y-2 ml-10">
                {dayApts.map(apt => {
                  const statusCfg = STATUS_CONFIG[(apt.status || 'PENDING').toUpperCase()] || STATUS_CONFIG.PENDING;
                  const clientName = apt.client?.firstName
                    ? `${apt.client.firstName} ${apt.client.lastName || ''}`.trim()
                    : apt.clientDetails?.fullName || 'Unknown';
                  return (
                    <button
                      key={apt.id}
                      onClick={() => onEdit(apt)}
                      className={`w-full text-left p-3 rounded-xl border-l-4 ${statusCfg.bg} ${statusCfg.border} shadow-sm hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-slate-800 truncate">{clientName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{apt.service?.name || 'Treatment'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {format(parseISO(apt.startTime), 'HH:mm')}
                          </span>
                        </div>
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
  );
};
