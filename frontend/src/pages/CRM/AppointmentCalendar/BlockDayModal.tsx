import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '@/services/api';
import { createClinicUTCDateTime } from './useCalendarData';
import type { BlockDayFormData } from './types';

interface BlockDayModalProps {
  isOpen: boolean;
  initialDate?: string;
  clinics: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const BLOCK_DAY_REASONS = [
  { value: 'CLINIC_CLOSED', label: 'Clinic Closed' },
  { value: 'PUBLIC_HOLIDAY', label: 'Public Holiday' },
  { value: 'STAFF_TRAINING', label: 'Staff Training' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
];

export const BlockDayModal: React.FC<BlockDayModalProps> = ({
  isOpen,
  initialDate,
  clinics,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [form, setForm] = useState<BlockDayFormData>({
    clinicId: clinics[0]?.id || '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    reason: 'CLINIC_CLOSED',
  });

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        clinicId: prev.clinicId || clinics[0]?.id || '',
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
      }));
      setCustomReason('');
    }
  }, [isOpen, initialDate, clinics]);

  const handleSubmit = async () => {
    if (!form.clinicId) { toast.error('Please select a clinic.'); return; }
    if (!form.date) { toast.error('Please select a date.'); return; }

    const baseReason = BLOCK_DAY_REASONS.find(r => r.value === form.reason)?.label || form.reason;
    const reasonText = form.reason === 'OTHER'
      ? customReason || 'Other'
      : customReason ? `${baseReason} - ${customReason}` : baseReason;

    // Get clinic timezone
    const clinic = clinics.find(c => c.id === form.clinicId);
    const tz = clinic?.timezone || 'UTC';

    // Block the entire day in the clinic's timezone
    const localDate = new Date(`${form.date}T12:00:00`);
    const dayStart = createClinicUTCDateTime(localDate, '00:00', tz);
    
    // We create 23:59 and add 59 seconds to it manually since createClinicUTCDateTime takes HH:mm
    const dayEnd = createClinicUTCDateTime(localDate, '23:59', tz);
    dayEnd.setSeconds(59);

    setIsSubmitting(true);
    try {
      await adminAPI.blockSlot({
        clinicId: form.clinicId,
        providerId: null,
        startTime: dayStart.toISOString(),
        endTime: dayEnd.toISOString(),
        reason: reasonText,
      });
      toast.success(`${form.date} has been blocked — Clinic Closed`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to block day.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedDate = form.date ? new Date(form.date + 'T12:00:00') : new Date();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Block Entire Day</h2>
              <p className="text-[10px] text-red-200">No appointments can be booked</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-0 m-0">
          {/* Warning Banner */}
          <div className="mx-6 mt-5 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-medium">
              Blocking an entire day will prevent any new appointments from being booked on that date. Existing appointments will not be affected.
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
          {/* Clinic */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">Clinic</label>
            <select
              value={form.clinicId}
              onChange={e => setForm(prev => ({ ...prev, clinicId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">Select clinic...</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">Date to Block</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-2">Reason</label>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_DAY_REASONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, reason: opt.value }))}
                  className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                    form.reason === opt.value
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Additional details (optional)..."
              className="mt-3 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[12px] font-black text-red-700 mb-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-[11px] text-red-600">
              Entire day will be blocked — 00:00 to 23:59
            </p>
            <p className="text-[10px] text-red-500 mt-1">
              Reason: {form.reason === 'OTHER' 
                ? customReason || '—' 
                : customReason 
                  ? `${BLOCK_DAY_REASONS.find(r => r.value === form.reason)?.label} - ${customReason}`
                  : BLOCK_DAY_REASONS.find(r => r.value === form.reason)?.label}
            </p>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-[12px] font-black bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Block Day
          </button>
        </div>
      </div>
    </div>
  );
};
