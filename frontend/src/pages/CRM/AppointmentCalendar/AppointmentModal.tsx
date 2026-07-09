import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  X, Search, User, Scissors, MapPin, Clock, StickyNote,
  CreditCard, Banknote, Trash2, AlertCircle, CheckCircle, Loader2, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { bookingAPI, crmAPI, clinicsAPI } from '@/services/api';
import { APPOINTMENT_STATUS_OPTIONS, DURATION_OPTIONS, STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from './constants';
import type { AppointmentFormData, CalendarAppointment, ConflictInfo } from './types';
import { createClinicUTCDateTime, getClinicLocalTime, getClinicLocalDate } from './useCalendarData';
import { useConflictDetection } from './useConflictDetection';

interface AppointmentModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<AppointmentFormData>;
  existingAppointment?: CalendarAppointment | null;
  clinics: any[];
  salespersons: any[];
  appointments: any[];
  blockedSlots: any[];
  currentUserId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TAX_RATE = 0.05; // 5%

function computeTotal(amount: number, tax: number, discount: number): number {
  return Math.max(0, amount + amount * tax - discount);
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  mode,
  initialData,
  existingAppointment,
  clinics,
  salespersons,
  appointments,
  blockedSlots,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Services
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Time Slots
  const [availableSlots, setAvailableSlots] = useState<{ value: string, label: string, available?: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isTreatmentDropdownOpen, setIsTreatmentDropdownOpen] = useState(false);

  // Conflict
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  const { checkConflict } = useConflictDetection(appointments, blockedSlots);

  // Form state
  const [form, setForm] = useState<AppointmentFormData>({
    patientId: '',
    patientName: '',
    serviceId: '',
    serviceName: '',
    clinicId: '',
    clinicName: '',
    salesPersonId: currentUserId || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    durationMinutes: 60,
    status: 'PENDING',
    notes: '',
    paymentMethod: '',
    amount: 0,
    tax: TAX_RATE,
    discount: 0,
    paymentStatus: 'UNPAID',
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && existingAppointment) {
      const apt = existingAppointment;
      const start = new Date(apt.startTime);
      const end = new Date(apt.endTime);
      const durationMs = end.getTime() - start.getTime();
      const durationMin = Math.round(durationMs / 60000);

      const clientName = apt.client?.firstName
        ? `${apt.client.firstName} ${apt.client.lastName || ''}`.trim()
        : apt.clientDetails?.fullName || '';

      const serviceAmount = parseFloat(String(apt.service?.price || apt.totalAmount || 0));
      const paid = parseFloat(String(apt.amountPaid || 0));

      let paymentStatus: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' = 'UNPAID';
      if (paid > 0 && paid >= serviceAmount) paymentStatus = 'PAID';
      else if (paid > 0) paymentStatus = 'PARTIALLY_PAID';

      setSelectedPatient(apt.client || { id: apt.clientId, firstName: clientName });
      setForm({
        patientId: apt.clientId,
        patientName: clientName,
        serviceId: apt.serviceId,
        additionalServiceIds: apt.additionalServiceIds || [],
        serviceName: apt.service?.name || (apt as any).serviceName || '',
        clinicId: apt.clinicId,
        clinicName: apt.clinic?.name || '',
        salesPersonId: apt.providerId || '',
        date: getClinicLocalDate(apt.startTime, apt.clinic?.timezone || 'UTC'),
        startTime: (() => {
          const tz = apt.clinic?.timezone || 'UTC';
          const { hour, minute } = getClinicLocalTime(apt.startTime, tz);
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        })(),
        durationMinutes: durationMin,
        status: apt.status as any,
        notes: apt.notes || '',
        paymentMethod: apt.paymentMethod as any || '',
        amount: serviceAmount,
        tax: TAX_RATE,
        discount: 0,
        paymentStatus,
      });
    } else {
      // Create mode
      setForm(prev => ({
        ...prev,
        patientId: '',
        patientName: '',
        serviceId: '',
        additionalServiceIds: [],
        serviceName: '',
        salesPersonId: currentUserId || '',
        status: 'PENDING',
        notes: '',
        paymentMethod: '',
        amount: 0,
        discount: 0,
        paymentStatus: 'UNPAID',
        ...(initialData || {}),
      }));
      setSelectedPatient(null);
    }

    setConflict(null);
    setPatientSearch('');
    setPatientResults([]);
  }, [isOpen, mode, existingAppointment, initialData, currentUserId]);

  // Fetch services when clinic changes
  useEffect(() => {
    if (!form.clinicId) return;
    setIsLoadingServices(true);
    clinicsAPI.getServices(form.clinicId)
      .then((res: any) => setAvailableServices(res.data || []))
      .catch(() => setAvailableServices([]))
      .finally(() => setIsLoadingServices(false));
  }, [form.clinicId]);

  // Fetch available slots
  useEffect(() => {
    if (!form.clinicId || !form.serviceId || !form.date) {
      setAvailableSlots([]);
      return;
    }

    // Get the clinic timezone so we display slots in clinic local time
    // (same approach as AppointmentBooking.tsx formatClinicTime)
    const clinic = clinics.find((c: any) => c.id === form.clinicId);
    const clinicTz = clinic?.timezone || 'UTC';

    const formatInClinicTz = (utcIso: string): string => {
      const d = new Date(utcIso);
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: clinicTz,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
        });
        const parts = formatter.formatToParts(d);
        const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
        const normalizedH = h === 24 ? 0 : h;
        return `${normalizedH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } catch {
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    };

    setIsLoadingSlots(true);
    bookingAPI.getAvailability({
      clinicId: form.clinicId,
      serviceId: form.serviceId,
      date: form.date,
      providerId: form.salesPersonId || undefined,
      allowPast: true,
    })
      .then((res: any) => {
        const slotsData = res.data?.slots || res.data?.data || res.data;
        const slots = Array.isArray(slotsData) ? slotsData : [];
        if (slots.length > 0) {
          const formattedSlots = slots.map((s: any) => {
            // Convert UTC ISO → clinic timezone → HH:mm (24h)
            const timeStr = formatInClinicTz(s.startTime);
            return { value: timeStr, label: timeStr, available: s.available !== false };
          });
          setAvailableSlots(formattedSlots);
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setIsLoadingSlots(false));
  }, [form.clinicId, form.serviceId, form.date, form.salesPersonId, clinics]);

  // Patient search
  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearchingPatients(true);
      try {
        const [leadsRes, custRes] = await Promise.all([
          crmAPI.getLeads({ search: patientSearch }),
          crmAPI.getCustomers({ search: patientSearch })
        ]);

        const leads = leadsRes.data?.data || leadsRes.data || [];
        const custRecords = custRes.data?.data || custRes.data || [];
        const customers = custRecords.map((r: any) => ({ ...r.customer, isCustomer: true }));

        const combined = [...customers, ...leads];
        const unique = [];
        const seen = new Set();

        for (const p of combined) {
          // Use email or phone or id as a unique key to deduplicate Lead vs Customer entries
          const key = p.email || p.phone || p.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            unique.push(p);
          } else if (!key) {
            unique.push(p);
          }
        }

        setPatientResults(unique);
      } catch {
        setPatientResults([]);
      } finally {
        setIsSearchingPatients(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleServicesChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      setForm(prev => ({
        ...prev,
        serviceId: '',
        additionalServiceIds: [],
        serviceName: '',
        amount: 0,
        durationMinutes: 60,
      }));
      return;
    }

    const primaryId = selectedIds[0];
    const additionalIds = selectedIds.slice(1);
    const primarySvc = availableServices.find(s => s.id === primaryId);

    let totalAmount = 0;
    let totalDuration = 0;

    selectedIds.forEach(id => {
      const svc = availableServices.find(s => s.id === id);
      if (svc) {
        totalAmount += parseFloat(svc.price || '0') || 0;
        totalDuration += svc.durationMinutes || 60;
      }
    });

    setForm(prev => ({
      ...prev,
      serviceId: primaryId,
      additionalServiceIds: additionalIds,
      serviceName: primarySvc?.name || '',
      amount: totalAmount,
      durationMinutes: totalDuration,
    }));
  };

  const handleClinicChange = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    setForm(prev => ({ ...prev, clinicId, clinicName: clinic?.name || '', serviceId: '', serviceName: '', amount: 0 }));
    setAvailableServices([]);
  };

  const selectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setForm(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
    }));
    setPatientSearch('');
    setPatientResults([]);
  };

  const displaySlots = React.useMemo(() => {
    // Only show slots when treatment+clinic are selected (availableSlots was fetched)
    if (availableSlots.length === 0) return [];

    const exists = availableSlots.some(s => s.value === form.startTime);
    if (exists || !form.startTime) return availableSlots;

    // Edit mode: the existing appointment time may not be in the fetched slots — add it
    const [h, m] = form.startTime.split(':');
    const missingSlot = {
      value: form.startTime,
      label: `${h.padStart(2, '0')}:${m}`,
      available: true
    };

    return [...availableSlots, missingSlot].sort((a, b) => a.value.localeCompare(b.value));
  }, [availableSlots, form.startTime]);

  const validateAndCheckConflict = useCallback((): boolean => {
    if (!form.isNewPatient && !form.patientId) { toast.error('Please select a patient.'); return false; }
    if (form.isNewPatient && (!form.newPatientDetails?.fullName || (!form.newPatientDetails?.phone && !form.newPatientDetails?.email))) {
      toast.error('Please provide at least a name and either a phone number or email for the new patient.');
      return false;
    }
    if (!form.serviceId) { toast.error('Please select a treatment.'); return false; }
    if (!form.clinicId) { toast.error('Please select a clinic.'); return false; }
    if (!form.date || !form.startTime) { toast.error('Please set date and time.'); return false; }

    const clinic = clinics.find(c => c.id === form.clinicId);
    const tz = clinic?.timezone || 'UTC';
    const localDate = new Date(form.date + 'T00:00:00');
    const startUTC = createClinicUTCDateTime(localDate, form.startTime, tz);
    const endUTC = new Date(startUTC.getTime() + form.durationMinutes * 60000);

    const conflictResult = checkConflict({
      startTime: startUTC.toISOString(),
      endTime: endUTC.toISOString(),
      salesPersonId: form.salesPersonId,
      clinicId: form.clinicId,
      excludeAppointmentId: mode === 'edit' ? existingAppointment?.id : undefined,
    });

    if (conflictResult.hasConflict) {
      setConflict(conflictResult);
      return false;
    }
    setConflict(null);
    return true;
  }, [form, clinics, checkConflict, mode, existingAppointment]);

  const handleSave = async () => {
    if (!validateAndCheckConflict()) return;
    setIsSubmitting(true);

    const clinic = clinics.find(c => c.id === form.clinicId);
    const tz = clinic?.timezone || 'UTC';
    const localDate = new Date(form.date + 'T00:00:00');
    const startUTC = createClinicUTCDateTime(localDate, form.startTime, tz);
    const endUTC = new Date(startUTC.getTime() + form.durationMinutes * 60000);

    try {
      if (mode === 'create') {
        const payload: any = {
          clinicId: form.clinicId,
          serviceId: form.serviceId,
          additionalServiceIds: form.additionalServiceIds,
          providerId: form.salesPersonId || undefined,
          startTime: startUTC.toISOString(),
          endTime: endUTC.toISOString(),
          status: form.status,
          notes: form.notes,
        };

        if (form.isNewPatient && form.newPatientDetails) {
          payload.clientId = '00000000-0000-0000-0000-000000000000'; // dummy ID for backend to know it's a new customer
          payload.clientDetails = form.newPatientDetails;
        } else {
          payload.clientId = form.patientId;
        }

        await bookingAPI.createAppointment(payload);
        toast.success('Appointment created successfully!');
      } else {
        await bookingAPI.updateAppointment(existingAppointment!.id, {
          startTime: startUTC.toISOString(),
          endTime: endUTC.toISOString(),
          serviceId: form.serviceId,
          additionalServiceIds: form.additionalServiceIds,
          providerId: form.salesPersonId || undefined,
          notes: form.notes,
        });
        // Update status separately if changed
        if (form.status !== existingAppointment?.status) {
          await bookingAPI.updateStatus(existingAppointment!.id, form.status);
        }
        toast.success('Appointment updated successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAppointment || !window.confirm('Are you sure you want to delete this appointment?')) return;
    setIsDeleting(true);
    try {
      await bookingAPI.deleteAppointment(existingAppointment.id);
      toast.success('Appointment deleted.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete appointment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePayAtVenue = async () => {
    if (!existingAppointment) return;
    setIsSubmitting(true);
    try {
      await bookingAPI.updateStatus(existingAppointment.id, 'PENDING');
      toast.success('Marked as Pay at Venue — appointment stays pending.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayCard = async () => {
    if (!existingAppointment) return;
    const total = computeTotal(form.amount, form.tax, form.discount);
    setIsSubmitting(true);
    try {
      await bookingAPI.recordPayment(existingAppointment.id, {
        amount: total,
        method: 'card',
        notes: 'Paid via Card',
      });
      toast.success('Card payment recorded!');
      setForm(prev => ({ ...prev, paymentStatus: 'PAID' }));
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record card payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayCash = async () => {
    if (!existingAppointment) return;
    const total = computeTotal(form.amount, form.tax, form.discount);
    setIsSubmitting(true);
    try {
      await bookingAPI.recordPayment(existingAppointment.id, {
        amount: total,
        method: 'cash',
        notes: 'Paid via Cash',
      });
      toast.success('Cash payment recorded!');
      setForm(prev => ({ ...prev, paymentStatus: 'PAID' }));
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record cash payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = computeTotal(form.amount, form.tax, form.discount);
  const taxAmount = form.amount * form.tax;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Right-side Drawer */}
      <div
        className={`fixed top-0 right-0 z-[1000] h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-emerald-500">
          <div>
            <h2 className="text-base font-black text-white">
              {mode === 'create' ? 'New Appointment' : 'Edit Appointment'}
            </h2>
            <p className="text-[10px] text-emerald-100 font-semibold">
              {mode === 'create' ? 'Fill in the details below' : existingAppointment ? `ID: #${existingAppointment.id.slice(-8).toUpperCase()}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>



        {/* Conflict Alert */}
        {conflict?.hasConflict && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 font-semibold">{conflict.message}</p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Patient Search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide">
                  <User className="inline w-3 h-3 mr-1" /> Patient *
                </label>
                {mode === 'create' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setForm(prev => ({
                        ...prev,
                        isNewPatient: !prev.isNewPatient,
                        patientId: '',
                        patientName: '',
                        newPatientDetails: { fullName: '', email: '', phone: '' }
                      }));
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded"
                  >
                    {form.isNewPatient ? 'Use Existing' : '+ New Patient'}
                  </button>
                )}
              </div>

              {form.isNewPatient ? (
                <div className="space-y-2 bg-slate-50 p-3 border border-slate-200 rounded-xl">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={form.newPatientDetails?.fullName || ''}
                    onChange={e => setForm(prev => ({ ...prev, newPatientDetails: { ...prev.newPatientDetails!, fullName: e.target.value } }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Phone"
                      value={form.newPatientDetails?.phone || ''}
                      onChange={e => setForm(prev => ({ ...prev, newPatientDetails: { ...prev.newPatientDetails!, phone: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={form.newPatientDetails?.email || ''}
                      onChange={e => setForm(prev => ({ ...prev, newPatientDetails: { ...prev.newPatientDetails!, email: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              ) : selectedPatient ? (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[11px] font-black">
                    {selectedPatient.firstName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 truncate">
                      {form.patientName}
                    </p>
                    {selectedPatient.phone && (
                      <p className="text-[10px] text-slate-400">{selectedPatient.phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedPatient(null); setForm(prev => ({ ...prev, patientId: '', patientName: '' })); }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search patient by name or phone..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  {isSearchingPatients && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                  )}
                  {patientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                      {patientResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => selectPatient(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                        >
                          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-[10px] font-black">
                            {p.firstName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-slate-700">{p.firstName} {p.lastName}</p>
                            <p className="text-[10px] text-slate-400">{p.phone || p.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clinic */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <MapPin className="inline w-3 h-3 mr-1" /> Clinic *
              </label>
              <SearchableSelect
                value={form.clinicId || ''}
                onChange={value => handleClinicChange(value)}
                options={clinics.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select clinic..."
              />
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <Scissors className="inline w-3 h-3 mr-1" /> Treatment *
              </label>
              {isLoadingServices ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-[12px] text-slate-400">Loading services...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <SearchableSelect
                    value={form.serviceId || ''}
                    onChange={value => {
                      const newIds = [value, ...(form.additionalServiceIds || [])];
                      handleServicesChange(newIds.filter(Boolean));
                    }}
                    disabled={!form.clinicId}
                    placeholder={form.clinicId ? 'Select primary treatment...' : 'Select clinic first'}
                    options={availableServices.map(s => ({
                      value: s.id,
                      label: `${s.name} ${s.price ? `— $${s.price}` : ''} ${s.durationMinutes ? `(${s.durationMinutes}m)` : ''}`.trim()
                    }))}
                  />

                  {form.additionalServiceIds?.map((id, index) => (
                    <div key={`additional-${index}`} className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          value={id || ''}
                          onChange={value => {
                            const newAdditional = [...(form.additionalServiceIds || [])];
                            newAdditional[index] = value;
                            handleServicesChange([form.serviceId, ...newAdditional]);
                          }}
                          placeholder="Select additional treatment..."
                          options={availableServices.map(s => ({
                            value: s.id,
                            label: `${s.name} ${s.price ? `— $${s.price}` : ''} ${s.durationMinutes ? `(${s.durationMinutes}m)` : ''}`.trim()
                          }))}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newAdditional = [...(form.additionalServiceIds || [])];
                          newAdditional.splice(index, 1);
                          handleServicesChange([form.serviceId, ...newAdditional].filter(Boolean));
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {form.serviceId && (
                    <button
                      type="button"
                      onClick={() => {
                        handleServicesChange([form.serviceId, ...(form.additionalServiceIds || []), '']);
                      }}
                      className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add another treatment
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sales Person */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <User className="inline w-3 h-3 mr-1" /> Sales Person
              </label>
              <select
                value={form.salesPersonId}
                onChange={e => setForm(prev => ({ ...prev, salesPersonId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Unassigned</option>
                {salespersons.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                Target Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Available Windows */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                Available Windows
              </label>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-[12px] text-slate-400">Loading slots...</span>
                </div>
              ) : displaySlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {displaySlots.map(opt => {
                    const isSelected = form.startTime === opt.value;
                    const isDisabled = !opt.available && !isSelected;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setForm(prev => ({ ...prev, startTime: opt.value }))}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition-all ${
                          isDisabled
                            ? 'bg-red-50 border-red-200 text-red-400 line-through cursor-not-allowed'
                            : isSelected
                              ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ) : !form.serviceId ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[12px] text-slate-400">Select a Treatment to view available slots</span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[12px] text-slate-400">No slots available</span>
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <Clock className="inline w-3 h-3 mr-1" /> Duration
              </label>
              <select
                value={form.durationMinutes}
                onChange={e => setForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {APPOINTMENT_STATUS_OPTIONS.map(opt => {
                  const cfg = STATUS_CONFIG[opt.value] || STATUS_CONFIG.PENDING;
                  const isSelected = form.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm(prev => ({ ...prev, status: opt.value as any }))}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-bold transition-all ${isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm`
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? cfg.dot : 'bg-slate-300'}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5">
                <StickyNote className="inline w-3 h-3 mr-1" /> Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Add any notes about this appointment..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          </div>

          {/* ── Payment Section ── */}
          <div className="pt-2 border-t border-slate-100">

            {/* Payment status badge */}
            {form.paymentStatus === 'PAID' ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-[12px] font-black text-emerald-700">Payment Complete</p>
                  {existingAppointment?.amountPaid && parseFloat(String(existingAppointment.amountPaid)) > 0 && (
                    <p className="text-[11px] text-emerald-600">
                      Paid: ${parseFloat(String(existingAppointment.amountPaid)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* ── Collect Payment Card ── */
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-100">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <p className="text-[13px] font-black text-emerald-800">Collect Payment</p>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {/* Amount input */}
                  <div>
                    <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={total.toFixed(2)}
                      readOnly
                      className="w-full px-4 py-3 text-[22px] font-black text-slate-800 bg-white border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-400 text-center tracking-wide"
                    />
                    {/* Breakdown hint — the field above shows the total that will actually be charged */}
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      ${form.amount.toFixed(2)} + ${taxAmount.toFixed(2)} tax − ${form.discount.toFixed(2)} disc
                    </p>
                  </div>

                  {/* PAY AT VENUE + CARD row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pay at Venue */}
                    <button
                      onClick={handlePayAtVenue}
                      disabled={isSubmitting}
                      className="flex flex-col items-center gap-1.5 p-4 bg-white border-2 border-emerald-300 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all disabled:opacity-50 group"
                    >
                      <MapPin className="w-6 h-6 text-emerald-500 group-hover:text-emerald-600" />
                      <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wide">Pay at Venue</span>
                      <span className="text-[9px] text-slate-400 text-center leading-tight">Confirm &amp; stay pending</span>
                    </button>

                    {/* Card */}
                    <button
                      onClick={handlePayCard}
                      disabled={isSubmitting}
                      className="flex flex-col items-center gap-1.5 p-4 bg-white border-2 border-indigo-300 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition-all disabled:opacity-50 group"
                    >
                      <CreditCard className="w-6 h-6 text-indigo-500 group-hover:text-indigo-600" />
                      <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wide">Card</span>
                      <span className="text-[9px] text-slate-400 text-center leading-tight">Record as Card &amp; Complete</span>
                    </button>
                  </div>

                  {/* CASH button */}
                  <button
                    onClick={handlePayCash}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-[13px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Banknote className="w-5 h-5" />
                    )}
                    Cash — Collect &amp; Complete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {mode === 'edit' ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-[12px] font-black bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'create' ? 'Create Appointment' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
