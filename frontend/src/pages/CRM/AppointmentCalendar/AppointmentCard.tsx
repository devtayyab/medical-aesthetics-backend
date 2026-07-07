import React, { useState } from 'react';
import { Clock, User, CreditCard, GripVertical } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG, SALESPERSON_COLORS } from './constants';
import type { CalendarAppointment } from './types';

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  style: React.CSSProperties;
  onEdit: (apt: CalendarAppointment) => void;
  onDragStart: (e: React.MouseEvent, apt: CalendarAppointment) => void;
  onResizeStart: (e: React.MouseEvent, apt: CalendarAppointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  style,
  onEdit,
  onDragStart,
  onResizeStart,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const apt = appointment;
  const normalizedStatus = (apt.status || 'PENDING').toUpperCase();
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING;
  const paymentCfg = PAYMENT_STATUS_CONFIG[apt.computedPaymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;

  const clientName =
    apt.client?.firstName
      ? `${apt.client.firstName} ${apt.client.lastName || ''}`.trim()
      : apt.clientDetails?.fullName || 'Unknown Patient';

  let treatmentName =
    apt.service?.name ||
    apt.service?.treatment?.name ||
    (apt as any).serviceName ||
    (apt as any).displayName ||
    'Treatment';

  if (apt.additionalServiceIds && apt.additionalServiceIds.length > 0) {
    treatmentName += ` + ${apt.additionalServiceIds.length} more`;
  }

  const treatmentPrice = Number(apt.service?.price || apt.amount || 0);
  
  const clientPhone =
    apt.client?.phone || apt.clientDetails?.phone || 'No phone provided';

  const providerName =
    apt.provider?.firstName
      ? `${apt.provider.firstName} ${apt.provider.lastName || ''}`.trim()
      : (apt as any).providerName || 'Unassigned';

  const startDisplay = format(parseISO(apt.startTime), 'HH:mm');
  const endDisplay = format(parseISO(apt.endTime), 'HH:mm');
  const durationMin = differenceInMinutes(parseISO(apt.endTime), parseISO(apt.startTime));

  const isCompact = durationMin < 30;
  const isVeryCompact = durationMin < 20;

  const colorIdx = apt.colorIndex % SALESPERSON_COLORS.length;
  const salespersonColor = SALESPERSON_COLORS[colorIdx];

  return (
    <div
      className={`absolute rounded-r-lg cursor-pointer transition-all group select-none
        border-l-[3px] ${statusCfg.bg} ${statusCfg.border}
        shadow-sm hover:shadow-md hover:scale-[1.01] hover:z-30 z-20`}
      style={style}
      onClick={e => { e.stopPropagation(); onEdit(apt); }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
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
        </div>

        {!isVeryCompact && (
          <>
            {/* Treatment */}
            <span className={`text-slate-500 truncate leading-tight font-medium ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              {treatmentName}
            </span>

            {!isCompact && (
              <>
                {/* Time */}
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {startDisplay} – {endDisplay}
                  </span>
                </div>


              </>
            )}
          </>
        )}

        {/* Status + Payment badges */}
        {!isVeryCompact && (
          <div className="flex items-center gap-1 flex-wrap mt-auto pt-0.5">
            <span className={`text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${paymentCfg.bg} ${paymentCfg.text}`}>
              {paymentCfg.label}
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

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-full top-0 ml-2 w-64 bg-white text-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50 pointer-events-none border border-slate-100 flex flex-col gap-3">
          {/* Top Row: Time and Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 text-indigo-700">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col text-[12px] font-black leading-tight">
                <span>{startDisplay} –</span>
                <span>{endDisplay}</span>
              </div>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
          </div>

          <div className="w-full h-px bg-slate-100" />

          {/* Client Info */}
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-black text-slate-800 leading-tight">
              {clientName}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-[11px] font-medium">{clientPhone}</span>
            </div>
          </div>

          {/* Treatment Info */}
          <div className="bg-emerald-50/50 rounded-xl p-3 flex items-center justify-between mt-1">
            <span className="text-[11px] font-bold text-slate-700 truncate mr-2">
              {treatmentName}
            </span>
            <span className="text-[12px] font-black text-emerald-600 flex-shrink-0">
              €{treatmentPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
