import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Phone, AlertCircle, CheckCircle, Clock, User, 
  Calendar, List, FilePlus, CalendarPlus, X,
  ChevronDown, MessageSquare, Info, Star, Sparkles, FileText,
  ArrowRight, Video, Clipboard, MoreHorizontal, FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { css } from '@emotion/css';
import {
  logCommunication,
  updateCommunication,
  validateCommunication,
  getRequiredFieldsForCall
} from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import type { CommunicationLog } from '@/types';
import { crmAPI, userAPI, bookingAPI } from '@/services/api';

const inputContainerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const labelStyle = css`
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
  margin-left: 4px;
`;

const premiumInputStyle = css`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  height: 48px;
  padding: 0 16px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  outline: none;

  &:focus {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(203, 255, 56, 0.3);
    box-shadow: 0 0 20px rgba(203, 255, 56, 0.05);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
    font-style: italic;
  }
`;

const premiumSelectStyle = css`
  appearance: none;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  height: 48px;
  padding: 0 40px 0 16px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: rgba(203, 255, 56, 0.3);
  }

  option {
    background: #1C1C1C;
    color: white;
  }
`;

const sectionStyle = css`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
`;

interface CommunicationFormProps {
  customerId: string;
  initialData?: CommunicationLog;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CommunicationForm: React.FC<CommunicationFormProps> = ({
  customerId,
  initialData,
  onSuccess,
  onCancel
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState<Partial<CommunicationLog>>(initialData || {
    customerId,
    type: 'call',
    direction: 'outgoing',
    status: 'completed',
    metadata: {},
    salespersonId: (user as any)?.id || undefined
  });

  const [createFollowUpTask, setCreateFollowUpTask] = useState(false);
  const [scheduleAppointment, setScheduleAppointment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [clinics, setClinics] = useState<{ value: string; label: string }[]>([]);
  const [salespersons, setSalespersons] = useState<{ value: string; label: string }[]>([]);
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    dispatch(getRequiredFieldsForCall());
    (async () => {
      try {
        const [clinicRes, salesRes] = await Promise.all([
          crmAPI.getAccessibleClinics().catch(() => ({ data: [] })),
          userAPI.getAllUsers({ role: 'salesperson', limit: 100 }).catch(() => ({ data: { users: [] } }))
        ]);
        setClinics((clinicRes.data || []).map((c: any) => ({ value: c.id, label: c.name })));
        const salesData = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.users || [];
        setSalespersons(salesData.map((s: any) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` })));
      } catch (e) {}
    })();
  }, [dispatch]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: { ...prev.metadata, [metadataField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setValidationErrors(prev => prev.filter(err => err !== field.replace('metadata.', '')));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let payload = { ...formData };
      if (payload.type === 'call' && !payload.durationSeconds) {
        payload.durationSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      }

      if (initialData?.id) {
        await dispatch(updateCommunication({ id: initialData.id, updates: payload })).unwrap();
      } else {
        await dispatch(logCommunication(payload)).unwrap();
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to log communication:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 no-scrollbar overflow-y-auto max-h-[70vh] pr-2">
      {/* 1. Core Interaction Section */}
      <div className={sectionStyle}>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={16} className="text-[#CBFF38]" />
          <h3 className="text-xs font-black uppercase italic tracking-widest text-[#CBFF38]">Interaction Architecture</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={inputContainerStyle}>
            <label className={labelStyle}>Interaction Type</label>
            <div className="relative">
              <select 
                className={`${premiumSelectStyle} w-full`}
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <option value="call">Voice Transmission</option>
                <option value="email">Digital Correspondence</option>
                <option value="sms">SMS Network</option>
                <option value="meeting">Direct Consultation</option>
                <option value="note">Internal Memo</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Execution Status</label>
            <div className="relative">
              <select 
                className={`${premiumSelectStyle} w-full`}
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="completed">Finalized</option>
                <option value="missed">Transmission Failed</option>
                <option value="pending">Awaiting Sync</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="mt-6">
            <div className={inputContainerStyle}>
                <label className={labelStyle}>Subject / Objective</label>
                <input 
                    className={premiumInputStyle}
                    placeholder="E.g., Post-treatment followup consultation..."
                    value={formData.subject || ''}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* 2. Call Specifics (Conditional) */}
      {formData.type === 'call' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={sectionStyle}
        >
          <div className="flex items-center gap-2 mb-6">
            <Phone size={16} className="text-[#CBFF38]" />
            <h3 className="text-xs font-black uppercase italic tracking-widest text-[#CBFF38]">Telemetry Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>Operating Clinic</label>
              <div className="relative">
                <select 
                  className={`${premiumSelectStyle} w-full`}
                  value={formData.metadata?.clinic || ''}
                  onChange={(e) => handleInputChange('metadata.clinic', e.target.value)}
                >
                  <option value="">Select Clinic Node</option>
                  {clinics.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
              </div>
            </div>

            <div className={inputContainerStyle}>
              <label className={labelStyle}>Projected Cost ($)</label>
              <input 
                type="number"
                className={premiumInputStyle}
                placeholder="0.00"
                value={formData.metadata?.cost || ''}
                onChange={(e) => handleInputChange('metadata.cost', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>Clinical Outcome</label>
              <div className="relative">
                <select 
                  className={`${premiumSelectStyle} w-full`}
                  value={formData.metadata?.callOutcome || ''}
                  onChange={(e) => handleInputChange('metadata.callOutcome', e.target.value)}
                >
                  <option value="">Select Outcome Protocol</option>
                  <option value="interested">High Interest Identified</option>
                  <option value="not_interested">Neutral Disengagement</option>
                  <option value="callback">Scheduled Recall</option>
                  <option value="booked">Appointment Initialized</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Deep Analysis (Notes) */}
      <div className={sectionStyle}>
        <div className="flex items-center gap-2 mb-6">
          <FileText size={16} className="text-[#CBFF38]" />
          <h3 className="text-xs font-black uppercase italic tracking-widest text-[#CBFF38]">Case Observations</h3>
        </div>
        <div className={inputContainerStyle}>
          <label className={labelStyle}>Detailed Field Notes</label>
          <textarea 
            className={`${premiumInputStyle} h-32 py-4 resize-none`}
            placeholder="Document critical insights, patient concerns, and treatment responses here..."
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
        </div>
      </div>

      {/* 4. Strategic Continuity */}
      {!initialData && (
        <div className="flex flex-wrap gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`size-5 rounded border transition-all flex items-center justify-center ${createFollowUpTask ? 'bg-[#CBFF38] border-[#CBFF38]' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
                {createFollowUpTask && <CheckCircle size={14} className="text-black" />}
                <input type="checkbox" className="hidden" checked={createFollowUpTask} onChange={(e) => setCreateFollowUpTask(e.target.checked)} />
            </div>
            <span className="text-[10px] font-black uppercase italic tracking-widest text-white/40 group-hover:text-white/60 transition-colors">Queue Follow-up Task</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`size-5 rounded border transition-all flex items-center justify-center ${scheduleAppointment ? 'bg-[#CBFF38] border-[#CBFF38]' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
                {scheduleAppointment && <CheckCircle size={14} className="text-black" />}
                <input type="checkbox" className="hidden" checked={scheduleAppointment} onChange={(e) => setScheduleAppointment(e.target.checked)} />
            </div>
            <span className="text-[10px] font-black uppercase italic tracking-widest text-white/40 group-hover:text-white/60 transition-colors">Initialize Booking</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-8 border-t border-white/5">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-8 h-12 rounded-xl text-[10px] font-black uppercase italic tracking-widest text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          Abort
        </button>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="px-10 h-12 bg-[#CBFF38] text-black rounded-xl text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(203,255,56,0.3)] disabled:opacity-50"
        >
          {isSubmitting ? (
              <div className="animate-spin size-4 border-2 border-black/30 border-t-black rounded-full" />
          ) : <CheckCircle size={14} />}
          {initialData ? 'Update Record' : 'Synchronize Protocol'}
        </button>
      </div>
    </form>
  );
};
