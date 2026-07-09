import React, { useState, useEffect } from 'react';
import { X, Lock, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { adminAPI } from '@/services/api';
import { BLOCK_REASON_OPTIONS, TIME_OPTIONS } from './constants';
import { createClinicUTCDateTime } from './useCalendarData';
import type { BlockSlotFormData } from './types';

interface BlockSlotModalProps {
  isOpen: boolean;
  initialDate?: string;
  initialTime?: string;
  clinics: any[];
  salespersons: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BlockSlotModal: React.FC<BlockSlotModalProps> = ({
  isOpen,
  initialDate,
  initialTime,
  clinics,
  salespersons,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<BlockSlotFormData>({
    clinicId: clinics[0]?.id || '',
    salesPersonId: '',
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    startTime: initialTime || '10:00',
    endTime: '11:00',
    reason: 'MEETING',
    customReason: '',
  });

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        clinicId: prev.clinicId || clinics[0]?.id || '',
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: initialTime || '10:00',
      }));
    }
  }, [isOpen, initialDate, initialTime, clinics]);

  const handleSubmit = async () => {
    if (!form.clinicId) { toast.error('Please select a clinic.'); return; }
    if (!form.date || !form.startTime || !form.endTime) { toast.error('Please fill in all time fields.'); return; }

    const startMs = new Date(`${form.date}T${form.startTime}`).getTime();
    const endMs = new Date(`${form.date}T${form.endTime}`).getTime();
    if (endMs <= startMs) { toast.error('End time must be after start time.'); return; }

    const baseReason = form.reason.replace('_', ' ');
    const reasonText = form.reason === 'OTHER'
      ? form.customReason || 'Other'
      : form.customReason ? `${baseReason} - ${form.customReason}` : baseReason;

    const clinic = clinics.find(c => c.id === form.clinicId);
    const tz = clinic?.timezone || 'UTC';
    const localDate = new Date(`${form.date}T12:00:00`);
    
    const startDateTime = createClinicUTCDateTime(localDate, form.startTime, tz);
    const endDateTime = createClinicUTCDateTime(localDate, form.endTime, tz);

    setIsSubmitting(true);
    try {
      await adminAPI.blockSlot({
        clinicId: form.clinicId,
        providerId: form.salesPersonId || null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        reason: reasonText,
      });
      toast.success('Time slot blocked successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to block time slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Block Time Slot</h2>
              <p className="text-[10px] text-slate-400">Mark a time slot as unavailable</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Clinic */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">Clinic</label>
            <select
              value={form.clinicId}
              onChange={e => setForm(prev => ({ ...prev, clinicId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Select clinic...</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sales Person (optional) */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
              Sales Person <span className="text-slate-400 font-normal">(optional — leave blank for all)</span>
            </label>
            <select
              value={form.salesPersonId}
              onChange={e => setForm(prev => ({ ...prev, salesPersonId: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">All Staff</option>
              {salespersons.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <Clock className="inline w-3 h-3 mr-1" /> Start Time
              </label>
              <select
                value={form.startTime}
                onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <Clock className="inline w-3 h-3 mr-1" /> End Time
              </label>
              <select
                value={form.endTime}
                onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-2">Reason</label>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_REASON_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, reason: opt.value as any }))}
                  className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                    form.reason === opt.value
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.customReason}
              onChange={e => setForm(prev => ({ ...prev, customReason: e.target.value }))}
              placeholder="Additional details (optional)..."
              className="mt-3 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Preview */}
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <Lock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-orange-700 font-medium">
              <p>
                Blocking <strong>{form.date}</strong> from <strong>{form.startTime}</strong> to <strong>{form.endTime}</strong>.
                New appointments cannot be booked during this period.
              </p>
              <p className="mt-1 font-bold">
                Reason: {form.reason === 'OTHER' 
                  ? form.customReason || '—' 
                  : form.customReason 
                    ? `${form.reason.replace('_', ' ')} - ${form.customReason}`
                    : form.reason.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-[12px] font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Block Slot
          </button>
        </div>
      </div>
    </div>
  );
};
