import React, { useState, useRef, useCallback } from 'react';
import { Clock, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG, SALESPERSON_COLORS } from './constants';
import { getClinicLocalTime } from './useCalendarData';
import type { CalendarAppointment } from './types';

const MAX_VISIBLE_SERVICES = 5;

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  style: React.CSSProperties;
  timezone: string;
  onEdit: (apt: CalendarAppointment) => void;
  onDragStart: (e: React.MouseEvent, apt: CalendarAppointment) => void;
  onResizeStart: (e: React.MouseEvent, apt: CalendarAppointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  style,
  timezone,
  onEdit,
  onDragStart,
  onResizeStart,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delayed hide so tooltip doesn't vanish when mouse briefly leaves card
  const handleMouseEnter = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setShowTooltip(false);
      setExpanded(false); // reset expand state when tooltip hides
    }, 200);
  }, []);

  const apt = appointment;
  const normalizedStatus = (apt.status || 'PENDING').toUpperCase();
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING;
  const paymentCfg = PAYMENT_STATUS_CONFIG[apt.computedPaymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;

  const isFullDayBlocked = apt.isBlocked && apt.startTime?.includes('00:00:00') && (apt.endTime?.includes('23:59') || apt.endTime?.includes('23:00'));
  const clientName = apt.isBlocked
    ? (isFullDayBlocked ? 'Clinic Closed' : 'Blocked Slot')
    : apt.client?.firstName
    ? `${apt.client.firstName} ${apt.client.lastName || ''}`.trim()
    : apt.clientDetails?.fullName || 'Unknown Patient';

  const primaryServiceName = apt.isBlocked
    ? apt.displayName || apt.notes || apt.reason || 'Unavailable'
    : apt.service?.name ||
      apt.service?.treatment?.name ||
      (apt as any).serviceName ||
      (apt as any).displayName ||
      'Treatment';

  // Additional services — enriched from backend OR legacy IDs only
  const additionalServices: Array<{ name: string; price?: number }> =
    apt.additionalServices || [];
  const additionalServiceCount =
    additionalServices.length > 0
      ? additionalServices.length
      : (apt.additionalServiceIds?.length || 0);

  const totalServices = 1 + additionalServiceCount;

  // Build the full list for tooltip display
  const primaryPrice = Number(apt.service?.price || apt.amount || 0);
  const allServices: Array<{ name: string; price?: number; isPrimary?: boolean }> = [
    { name: primaryServiceName, price: primaryPrice, isPrimary: true },
    ...additionalServices,
  ];

  // Legacy: only IDs available (names not enriched yet)
  const legacyExtraCount =
    additionalServices.length === 0 && additionalServiceCount > 0
      ? additionalServiceCount
      : 0;

  const totalDisplayed = allServices.length + legacyExtraCount;

  const visibleServices = expanded ? allServices : allServices.slice(0, MAX_VISIBLE_SERVICES);
  const hiddenCount = allServices.length - MAX_VISIBLE_SERVICES;

  const clientPhone = apt.client?.phone || apt.clientDetails?.phone || 'No phone provided';

  const startLocal = getClinicLocalTime(apt.startTime, timezone);
  const endLocal = getClinicLocalTime(apt.endTime, timezone);
  const startDisplay = `${startLocal.hour.toString().padStart(2, '0')}:${startLocal.minute.toString().padStart(2, '0')}`;
  const endDisplay = `${endLocal.hour.toString().padStart(2, '0')}:${endLocal.minute.toString().padStart(2, '0')}`;
  const durationMin = differenceInMinutes(parseISO(apt.endTime), parseISO(apt.startTime));

  const isCompact = durationMin < 30;
  const isVeryCompact = durationMin < 20;

  const colorIdx = apt.colorIndex % SALESPERSON_COLORS.length;

  const blockedBg = 'bg-gray-100/80';
  const blockedBorder = 'border-gray-400';

  return (
    <div
      className={`absolute rounded-r-lg cursor-pointer transition-all group select-none
        border-l-[3px] ${apt.isBlocked ? blockedBg : statusCfg.bg} ${apt.isBlocked ? blockedBorder : statusCfg.border}
        shadow-sm hover:shadow-md hover:scale-[1.01] hover:z-30 z-20`}
      style={{ ...style, minHeight: 'fit-content' }}
      onClick={e => { e.stopPropagation(); onEdit(apt); }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onMouseDown={e => onDragStart(e, apt)}
      >
        <GripVertical className="w-3 h-3 text-slate-400" />
      </div>

      {/* Main Content */}
      <div className={`flex flex-col gap-0.5 ${isVeryCompact ? 'p-1 pl-4' : 'p-1.5 pl-4'} h-full`}>
        {/* Patient Name */}
        <div className="flex items-center gap-1 min-w-0">
          <span className={`font-black text-slate-800 truncate leading-tight ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
            {clientName}
          </span>
          {/* Show total services count badge if multiple */}
          {!apt.isBlocked && totalDisplayed > 1 && (
            <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 rounded-full px-1.5 flex-shrink-0">
              {totalDisplayed}
            </span>
          )}
        </div>

        {!isVeryCompact && (
          <>
            {/* Primary Treatment name */}
            <span className={`text-slate-500 truncate leading-tight font-medium ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              {primaryServiceName}
            </span>

            {!isCompact && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                <span className="text-[9px] text-slate-400 font-semibold">
                  {startDisplay} – {endDisplay}
                </span>
              </div>
            )}
          </>
        )}

        {/* Status + Payment badges */}
        {!isVeryCompact && !apt.isBlocked && (
          <div className="flex items-center gap-1 mt-auto pt-0.5 overflow-hidden">
            <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-[1px] rounded flex-shrink text-ellipsis overflow-hidden ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
            <span className={`text-[7px] font-bold px-1.5 py-[1px] rounded flex-shrink text-ellipsis overflow-hidden whitespace-nowrap ${paymentCfg.bg} ${paymentCfg.text}`}>
              {paymentCfg.label}
            </span>
          </div>
        )}
        {!isVeryCompact && apt.isBlocked && (
          <div className="flex items-center gap-1 flex-wrap mt-auto pt-0.5">
            <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 border border-gray-300">
              BLOCKED
            </span>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/10"
        onMouseDown={e => { e.stopPropagation(); onResizeStart(e, apt); }}
      >
        <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
      </div>

      {/* ── Tooltip ── */}
      {showTooltip && (
        <div
          className="absolute left-full top-0 ml-1 bg-white text-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] p-4 z-50 border border-slate-100 flex flex-col gap-3"
          style={{ width: 288, pointerEvents: 'auto' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={e => e.stopPropagation()}
        >
          {/* Top Row: Time + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 text-indigo-700">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col text-[12px] font-black leading-tight">
                <span>{startDisplay} –</span>
                <span>{endDisplay}</span>
              </div>
            </div>
            {!apt.isBlocked ? (
              <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300">
                BLOCKED
              </span>
            )}
          </div>

          <div className="w-full h-px bg-slate-100" />

          {/* Client Info */}
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-black text-slate-800 leading-tight">{clientName}</span>
            {!apt.isBlocked && clientPhone && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-[11px] font-medium">{clientPhone}</span>
              </div>
            )}
          </div>

          {/* ── Services List ── */}
          {!apt.isBlocked && (
            <div className="flex flex-col gap-1.5">

              {/* Show enriched services (up to MAX or all if expanded) */}
              {visibleServices.map((svc, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-2.5 flex items-center justify-between ${idx === 0 ? 'bg-emerald-50' : 'bg-slate-50'}`}
                >
                  <span className={`text-[11px] font-bold truncate mr-2 ${idx === 0 ? 'text-slate-700' : 'text-slate-600'}`}>
                    {svc.name}
                    {svc.isPrimary && totalDisplayed > 1 && (
                      <span className="ml-1 text-[8px] font-black text-emerald-600 bg-emerald-100 px-1 rounded-full">PRIMARY</span>
                    )}
                  </span>
                  {svc.price !== undefined && (
                    <span className="text-[12px] font-black text-emerald-600 flex-shrink-0">
                      €{Number(svc.price).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}

              {/* Legacy IDs-only services (no names available) */}
              {legacyExtraCount > 0 && (
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] font-semibold text-slate-400 italic">
                    + {legacyExtraCount} more service{legacyExtraCount > 1 ? 's' : ''} — click appointment to view
                  </span>
                </div>
              )}

              {/* Expand / Collapse button — only if > MAX_VISIBLE_SERVICES */}
              {allServices.length > MAX_VISIBLE_SERVICES && (
                <button
                  className="flex items-center justify-center gap-1 w-full py-1.5 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all text-[10px] font-black uppercase tracking-wider"
                  onClick={e => { e.stopPropagation(); setExpanded(prev => !prev); }}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      + {hiddenCount} more service{hiddenCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}

              <div className="h-px bg-slate-100" />

              {/* Payment badge + CTA */}
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${paymentCfg.bg} ${paymentCfg.text}`}>
                  {paymentCfg.label}
                </span>
                <button
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                  onClick={e => { e.stopPropagation(); onEdit(apt); }}
                >
                  Collect payment →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
