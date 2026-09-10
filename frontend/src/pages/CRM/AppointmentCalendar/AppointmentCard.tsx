import React, { useState, useRef, useCallback } from 'react';
import { Clock, Phone, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from './constants';
import { getClinicLocalTime } from './useCalendarData';
import type { CalendarAppointment } from './types';

const MAX_VISIBLE_SERVICES = 4;

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
  onDragStart: _onDragStart,
  onResizeStart: _onResizeStart,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tooltipSide, setTooltipSide] = useState<'right' | 'left'>('right');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    // Determine which side to show tooltip
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      setTooltipSide(spaceRight > 300 ? 'right' : 'left');
    }
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setShowTooltip(false);
      setExpanded(false);
    }, 150);
  }, []);

  const apt = appointment;
  const normalizedStatus = (apt.status || 'PENDING').toUpperCase();
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING;
  const paymentCfg = PAYMENT_STATUS_CONFIG[apt.computedPaymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;

  const isBlocked = apt.isBlocked;
  const isFullDayBlocked = isBlocked && apt.startTime?.includes('00:00:00') && (apt.endTime?.includes('23:59') || apt.endTime?.includes('23:00'));

  const clientName = isBlocked
    ? (isFullDayBlocked ? 'Clinic Closed' : 'Blocked Slot')
    : apt.client?.firstName
    ? `${apt.client.firstName} ${apt.client.lastName || ''}`.trim()
    : apt.clientDetails?.fullName || 'Unknown Patient';

  const clinicName = apt.clinic?.name || apt.clinicName || '';

  const primaryServiceName = isBlocked
    ? apt.displayName || apt.notes || apt.reason || 'Unavailable'
    : apt.service?.name || apt.service?.treatment?.name || (apt as any).serviceName || 'Treatment';

  const additionalServices: Array<{ name: string; price?: number }> = apt.additionalServices || [];
  const additionalServiceCount = additionalServices.length > 0 ? additionalServices.length : (apt.additionalServiceIds?.length || 0);
  const totalServices = 1 + additionalServiceCount;

  const primaryPrice = Number(apt.service?.price || apt.amount || 0);
  const allServices: Array<{ name: string; price?: number; isPrimary?: boolean }> = [
    { name: primaryServiceName, price: primaryPrice, isPrimary: true },
    ...additionalServices,
  ];
  const legacyExtraCount = additionalServices.length === 0 && additionalServiceCount > 0 ? additionalServiceCount : 0;
  const visibleServices = expanded ? allServices : allServices.slice(0, MAX_VISIBLE_SERVICES);
  const hiddenCount = allServices.length - MAX_VISIBLE_SERVICES;

  const clientPhone = apt.client?.phone || apt.clientDetails?.phone || '';

  const startLocal = getClinicLocalTime(apt.startTime, timezone);
  const endLocal = getClinicLocalTime(apt.endTime, timezone);
  const startDisplay = `${startLocal.hour.toString().padStart(2, '0')}:${startLocal.minute.toString().padStart(2, '0')}`;
  const endDisplay = `${endLocal.hour.toString().padStart(2, '0')}:${endLocal.minute.toString().padStart(2, '0')}`;
  const durationMin = differenceInMinutes(parseISO(apt.endTime), parseISO(apt.startTime));

  // ── Compact card border color from status ──
  const borderColor = isBlocked
    ? '#9ca3af'  // gray
    : normalizedStatus === 'CONFIRMED' ? '#10b981'
    : normalizedStatus === 'PENDING' ? '#f97316'
    : normalizedStatus === 'CANCELLED' ? '#ef4444'
    : normalizedStatus === 'COMPLETED' ? '#8b5cf6'
    : normalizedStatus === 'ARRIVED' ? '#3b82f6'
    : normalizedStatus === 'IN_PROGRESS' ? '#6366f1'
    : normalizedStatus === 'NO_SHOW' ? '#9ca3af'
    : '#6366f1';

  const bgColor = isBlocked
    ? 'rgba(243,244,246,0.9)'
    : normalizedStatus === 'CONFIRMED' ? 'rgba(236,253,245,0.95)'
    : normalizedStatus === 'PENDING' ? 'rgba(255,247,237,0.95)'
    : normalizedStatus === 'CANCELLED' ? 'rgba(254,242,242,0.95)'
    : normalizedStatus === 'COMPLETED' ? 'rgba(245,243,255,0.95)'
    : normalizedStatus === 'ARRIVED' ? 'rgba(239,246,255,0.95)'
    : normalizedStatus === 'IN_PROGRESS' ? 'rgba(238,242,255,0.95)'
    : 'rgba(249,250,251,0.95)';

  const isVeryShort = durationMin <= 20;

  return (
    <div
      ref={cardRef}
      className="absolute cursor-pointer select-none group"
      style={{ ...style, zIndex: showTooltip ? 50 : 20 }}
      onClick={e => { e.stopPropagation(); onEdit(apt); }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Compact Card ── */}
      <div
        className="w-full h-full rounded-md overflow-hidden transition-all duration-150 group-hover:shadow-lg group-hover:scale-[1.02]"
        style={{
          background: bgColor,
          borderLeft: `3px solid ${borderColor}`,
          boxShadow: `0 1px 3px rgba(0,0,0,0.08)`,
        }}
      >
        <div className="flex flex-col justify-start h-full px-1.5 py-1 gap-0.5 overflow-hidden">
          {/* Status dot + Client name */}
          <div className="flex items-center gap-1 min-w-0">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: borderColor }}
            />
            <span className="text-[10px] font-black text-slate-800 truncate leading-tight">
              {clientName}
            </span>
            {!isBlocked && totalServices > 1 && (
              <span className="text-[7px] font-black bg-indigo-100 text-indigo-600 rounded-full px-1 flex-shrink-0">
                {totalServices}
              </span>
            )}
          </div>

          {/* Clinic name — only show if not very short */}
          {!isVeryShort && clinicName && (
            <div className="flex items-center gap-0.5 min-w-0">
              <Building2 className="w-2 h-2 text-slate-400 flex-shrink-0" />
              <span className="text-[8px] text-slate-500 truncate font-medium leading-tight">
                {clinicName}
              </span>
            </div>
          )}

          {/* Time — only if enough space */}
          {!isVeryShort && durationMin >= 30 && (
            <div className="flex items-center gap-0.5 min-w-0 mt-auto">
              <Clock className="w-2 h-2 text-slate-400 flex-shrink-0" />
              <span className="text-[8px] text-slate-400 font-semibold leading-tight">
                {startDisplay}–{endDisplay}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Rich Hover Tooltip ── */}
      {showTooltip && (
        <div
          className="fixed z-[999] pointer-events-auto"
          style={{
            width: 280,
            ...(tooltipSide === 'right'
              ? { left: (cardRef.current?.getBoundingClientRect().right ?? 0) + 8, top: Math.min((cardRef.current?.getBoundingClientRect().top ?? 0), window.innerHeight - 420) }
              : { right: window.innerWidth - (cardRef.current?.getBoundingClientRect().left ?? 0) + 8, top: Math.min((cardRef.current?.getBoundingClientRect().top ?? 0), window.innerHeight - 420) }
            ),
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden">
            {/* Header strip */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: bgColor, borderBottom: `2px solid ${borderColor}` }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-black text-slate-800 leading-tight">{clientName}</span>
                {clinicName && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <Building2 className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{clinicName}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ background: borderColor, color: 'white' }}
                >
                  {isBlocked ? 'BLOCKED' : statusCfg.label}
                </span>
                {!isBlocked && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${paymentCfg.bg} ${paymentCfg.text}`}>
                    {paymentCfg.label}
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 py-3 flex flex-col gap-3">
              {/* Time */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-slate-800">{startDisplay} – {endDisplay}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{durationMin} minutes</span>
                </div>
              </div>

              {/* Phone */}
              {!isBlocked && clientPhone && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700">{clientPhone}</span>
                </div>
              )}

              {/* Services */}
              {!isBlocked && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Services</span>
                  {visibleServices.map((svc, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl px-3 py-2 flex items-center justify-between ${idx === 0 ? 'bg-emerald-50' : 'bg-slate-50'}`}
                    >
                      <span className={`text-[10px] font-bold truncate mr-2 ${idx === 0 ? 'text-slate-700' : 'text-slate-500'}`}>
                        {svc.name}
                        {svc.isPrimary && totalServices > 1 && (
                          <span className="ml-1 text-[7px] font-black text-emerald-600 bg-emerald-100 px-1 rounded-full">PRIMARY</span>
                        )}
                      </span>
                      {svc.price !== undefined && (
                        <span className="text-[11px] font-black text-emerald-600 flex-shrink-0">
                          €{Number(svc.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}

                  {legacyExtraCount > 0 && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-[9px] text-slate-400 italic">+{legacyExtraCount} more — click to view</span>
                    </div>
                  )}

                  {allServices.length > MAX_VISIBLE_SERVICES && (
                    <button
                      className="flex items-center justify-center gap-1 w-full py-1.5 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all text-[9px] font-black uppercase tracking-wider"
                      onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}
                    >
                      {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />+{hiddenCount} more</>}
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-slate-100" />

              {/* CTA */}
              <button
                className="w-full py-2 rounded-xl text-[11px] font-black text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${borderColor}, ${borderColor}cc)` }}
                onClick={e => { e.stopPropagation(); onEdit(apt); }}
              >
                View Full Details →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
