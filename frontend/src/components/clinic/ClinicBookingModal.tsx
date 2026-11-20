import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { X, User, Phone, Mail, ChevronRight, CheckCircle, Calendar, Clock, Building2 } from 'lucide-react';
import { useClinicBooking } from '@/hooks/useClinicBooking';
import type { RootState } from '@/store';

interface ClinicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clinicId: string;
  prefillClient?: {
    fullName: string;
    phone: string;
    email?: string;
  };
}

const ClinicBookingModal: React.FC<ClinicBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clinicId,
  prefillClient,
}) => {
  const { myClinics } = useSelector((state: RootState) => state.clinic);
  const [activeClinicId, setActiveClinicId] = useState<string>(clinicId);

  useEffect(() => {
    if (isOpen) {
      setActiveClinicId(clinicId);
    }
  }, [isOpen, clinicId]);

  const sortedClinics = useMemo(
    () =>
      [...(myClinics || [])].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', ['el', 'en'], { sensitivity: 'base' }),
      ),
    [myClinics],
  );
  const currentClinicName = sortedClinics.find((c) => c.id === activeClinicId)?.name;

  const {
    step,
    setStep,
    isLoading,
    error,
    setError,
    clientData,
    setClientData,
    notes,
    setNotes,
    disableNotifications,
    setDisableNotifications,
    sendInvitation,
    setSendInvitation,
    customStartTime,
    setCustomStartTime,
    customEndTime,
    setCustomEndTime,
    formatSlotStart,
    handleSelectSlot,
    services,
    providers,
    selectedService,
    setSelectedService,
    selectedProvider,
    setSelectedProvider,
    selectedDate,
    setSelectedDate,
    availableSlots,
    selectedSlot,
    slotReason,
    handleSubmit,
  } = useClinicBooking({
    isOpen,
    clinicId: activeClinicId,
    prefillClient,
    onSuccess,
    onClose,
  });

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
 <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
 {/* Header */}
 <div className="p-3 sm:p-6 border-b flex items-center justify-between bg-gray-50">
 <div>
 <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Direct Booking</h2>
 <p className="text-xs sm:text-sm text-gray-500">
   Add a walk-in or phone appointment{currentClinicName ? ` · ${currentClinicName}` : ''}
 </p>
 </div>
 <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors">
 <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
 {error && (
 <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 text-red-700 text-xs sm:text-sm">
 {error}
 </div>
 )}

 {/* Progress Indicators */}
 <div className="flex items-center justify-center gap-2 sm:gap-4">
 {[1, 2, 3].map((s) => (
 <div key={s} className="flex items-center gap-1.5 sm:gap-2">
 <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
 }`}>
 {step > s ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : s}
 </div>
 {s < 3 && <div className={`w-6 sm:w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
 </div>
 ))}
 </div>

 {/* Step 1: Client Info */}
 {step === 1 && (
 <div className="space-y-4 animate-in fade-in duration-300">
 <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Client Details</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 placeholder="e.g. John Doe"
 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
 value={clientData.fullName}
 onChange={(e) => setClientData({ ...clientData, fullName: e.target.value })}
 />
 </div>
 </div>
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Mobile Number *</label>
 <div className="relative">
 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="tel"
 placeholder="+30 6912345678"
 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
 value={clientData.phone}
 onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
 />
 </div>
 </div>
 <div className="md:col-span-2 space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Email Address (Optional)</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="email"
 placeholder="john@example.com"
 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
 value={clientData.email}
 onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Step 2: Service & Staff */}
 {step === 2 && (
 <div className="space-y-4 animate-in fade-in duration-300">
 <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Service & Selection</h3>
 <div className="space-y-4">
 {sortedClinics.length > 1 && (
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
   <Building2 className="w-3.5 h-3.5 text-blue-600" /> Clinic *
 </label>
 <select
   className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
   value={activeClinicId}
   onChange={(e) => setActiveClinicId(e.target.value)}
 >
   {sortedClinics.map((c) => (
     <option key={c.id} value={c.id}>
       {c.name}{c.address?.city ? ` (${c.address.city})` : ''}
     </option>
   ))}
 </select>
 </div>
 )}
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Select Service *</label>
 <select
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
 value={selectedService}
 onChange={(e) => setSelectedService(e.target.value)}
 >
 <option value="">Choose a treatment...</option>
 {services.map(s => (
 <option key={s.id} value={s.id}>
 {s.treatment?.name || s.name || 'Unnamed Service'} - €{s.price}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Prefer Staff member (Optional)</label>
 <select
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
 value={selectedProvider}
 onChange={(e) => setSelectedProvider(e.target.value)}
 >
 <option value="">Any Staff Member</option>
 {providers.map(p => (
 <option key={p.id} value={p.id}>
   {p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Staff Member'}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Appointment Notes</label>
 <textarea
 className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
 rows={3}
 placeholder="Any special requests or medical considerations..."
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <label className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none">
   <input
     type="checkbox"
     checked={disableNotifications || /^\s*(απ[όο]|from)\s+fresha\b/i.test(notes || '')}
     disabled={/^\s*(απ[όο]|from)\s+fresha\b/i.test(notes || '')}
     onChange={(e) => {
       setDisableNotifications(e.target.checked);
       if (e.target.checked) setSendInvitation(false);
     }}
     className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
   />
   <span className="text-xs font-bold text-gray-700">Disable automatic notifications (Email &amp; Push)</span>
 </label>
 <label className={`flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg select-none ${(disableNotifications || /^\s*(απ[όο]|from)\s+fresha\b/i.test(notes || '')) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
   <input
     type="checkbox"
     checked={!disableNotifications && !/^\s*(απ[όο]|from)\s+fresha\b/i.test(notes || '') && sendInvitation}
     disabled={disableNotifications || /^\s*(απ[όο]|from)\s+fresha\b/i.test(notes || '')}
     onChange={(e) => setSendInvitation(e.target.checked)}
     className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
   />
   <span className="text-xs font-bold text-gray-700">Send Invitation to Customer (Set your password email)</span>
 </label>
 </div>
 </div>
 </div>
 )}

 {/* Step 3: Date & Time */}
 {step === 3 && (
 <div className="space-y-4 animate-in fade-in duration-300">
 <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Schedule Time</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Select Date</label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
 <input
 type="date"
 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white white-indicator"
 value={selectedDate}
 onChange={(e) => setSelectedDate(e.target.value)}
 />
 </div>
 </div>
 <div className="space-y-1">
 <label className="text-xs font-bold text-gray-500 uppercase">Select Slot</label>
 <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
  {availableSlots.map((slot, i) => {
    const slotLabel = formatSlotStart(slot.startTime);
    const isSelected = selectedSlot === slot || (Boolean(customStartTime) && customStartTime === slotLabel);
    const isDisabled = slot.available === false && !isSelected;
    return (
      <button
        key={i}
        type="button"
        disabled={isDisabled}
        onClick={() => handleSelectSlot(slot)}
        className={`p-2 text-xs font-bold border rounded-lg transition-all ${
          isDisabled
            ? 'bg-red-50 border-red-200 text-red-400 line-through cursor-not-allowed'
            : isSelected
              ? 'bg-blue-600 text-white border-blue-600'
              : 'hover:bg-blue-50'
        }`}
      >
        {slotLabel}
      </button>
    );
  })}
 {availableSlots.length === 0 && (
 <div className="col-span-2 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
 <Clock className="w-7 h-7 text-gray-300 mb-2" />
 <p className="text-gray-500 font-bold text-xs text-center">No predefined slots available</p>
 {slotReason && (
 <p className="text-red-500 text-[10px] mt-1 text-center font-medium max-w-[200px]">
 {slotReason}
 </p>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 <div className="pt-3 border-t border-gray-100 space-y-2">
   <div className="flex items-center justify-between">
     <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
       <Clock className="w-3.5 h-3.5 text-blue-600" /> Custom Start &amp; End Time
     </label>
   </div>
   <p className="text-[11px] text-gray-500">
     Select a slot above or enter any custom start and end time (e.g. 17:45 – 18:00).
   </p>
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
     <div className="space-y-1">
       <label className="text-[11px] font-bold text-gray-500 uppercase block">Start Time *</label>
       <input
         type="time"
         value={customStartTime}
         onChange={(e) => setCustomStartTime(e.target.value)}
         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-semibold"
       />
     </div>
     <div className="space-y-1">
       <label className="text-[11px] font-bold text-gray-500 uppercase block">End Time *</label>
       <input
         type="time"
         value={customEndTime}
         onChange={(e) => setCustomEndTime(e.target.value)}
         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-semibold"
       />
     </div>
   </div>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
 <button
 onClick={() => step > 1 ? setStep(step - 1) : onClose()}
 className="px-6 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
 >
 {step === 1 ? 'Cancel' : 'Back'}
 </button>

 <button
 onClick={() => {
 if (step < 3) {
 if (step === 1 && (!clientData.fullName || !clientData.phone)) {
 setError('Please provide Name and Phone number');
 return;
 }
 if (step === 2 && !selectedService) {
 setError('Please select a service');
 return;
 }
 setStep(step + 1);
 setError(null);
 } else {
 handleSubmit();
 }
 }}
 disabled={isLoading}
 className="px-8 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-bold"
 >
 {isLoading ? 'Processing...' : step === 3 ? 'Confirm Booking' : 'Continue'}
 {step < 3 && <ChevronRight className="w-4 h-4" />}
 </button>
 </div>
 </div>
 </div>
 );
};

export default ClinicBookingModal;
