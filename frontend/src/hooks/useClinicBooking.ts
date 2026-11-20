import { useState, useEffect } from 'react';
import { clinicsAPI, bookingAPI } from '@/services/api';
import { format } from 'date-fns';
import { createClinicUTCDateTime, getClinicLocalTime } from '@/pages/CRM/AppointmentCalendar/useCalendarData';

const formatTimeInTz = (isoStr: string, tz: string): string => {
  const { hour, minute } = getClinicLocalTime(isoStr, tz);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const addMinutesHm = (startHm: string, minutes: number): string => {
  const [h, m] = startHm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m) || minutes <= 0) return '';
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const diffHm = (startHm: string, endHm: string): number => {
  const [sh, sm] = startHm.split(':').map(Number);
  const [eh, em] = endHm.split(':').map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  return (eh * 60 + em) - (sh * 60 + sm);
};

export interface UseClinicBookingOptions {
  isOpen: boolean;
  clinicId: string;
  prefillClient?: {
    fullName: string;
    phone: string;
    email?: string;
  };
  onSuccess: () => void;
  onClose: () => void;
}

export const useClinicBooking = ({
  isOpen,
  clinicId,
  prefillClient,
  onSuccess,
  onClose,
}: UseClinicBookingOptions) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [clientData, setClientData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  const [notes, setNotes] = useState('');
  const [disableNotifications, setDisableNotifications] = useState(false);
  const [sendInvitation, setSendInvitation] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [clinicTimezone, setClinicTimezone] = useState('Europe/Athens');

  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slotReason, setSlotReason] = useState<string | null>(null);

  // Reset modal form state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
      setDisableNotifications(false);
      setSendInvitation(false);
      setCustomStartTime('');
      setCustomEndTime('');
      setError(null);
      if (prefillClient) {
        setClientData({
          fullName: prefillClient.fullName || '',
          phone: prefillClient.phone || '',
          email: prefillClient.email || '',
        });
        setStep(2);
      } else {
        setStep(1);
        setClientData({ fullName: '', phone: '', email: '' });
      }
    }
  }, [isOpen, prefillClient]);

  // Reload clinic services/providers/timezone whenever the selected clinic changes
  // (without wiping entered client info or jumping back to Step 1)
  useEffect(() => {
    if (isOpen && clinicId) {
      setSelectedService('');
      setSelectedProvider('');
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSlotReason(null);
      fetchClinicData();
    }
  }, [isOpen, clinicId]);

  const fetchClinicData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, providersRes, clinicRes] = await Promise.all([
        clinicsAPI.getServices(clinicId),
        clinicsAPI.getProviders(clinicId),
        clinicsAPI.getById(clinicId).catch(() => null),
      ]);
      setServices(servicesRes.data || []);
      setProviders(providersRes.data || []);
      const tz = (clinicRes as any)?.data?.timezone;
      if (tz && String(tz).trim()) {
        setClinicTimezone(String(tz).trim());
      }
    } catch (err) {
      console.error('Failed to fetch clinic data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedServiceObj = services.find((s) => s.id === selectedService);
  const defaultDurationMinutes = Number(selectedServiceObj?.durationMinutes || selectedServiceObj?.duration) || 30;

  const formatSlotStart = (isoStr: string) => formatTimeInTz(isoStr, clinicTimezone);

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot);
    if (slot?.startTime) {
      const startHm = formatTimeInTz(slot.startTime, clinicTimezone);
      setCustomStartTime(startHm);
      setCustomEndTime(
        slot.endTime ? formatTimeInTz(slot.endTime, clinicTimezone) : addMinutesHm(startHm, defaultDurationMinutes)
      );
    }
  };

  const handleCustomStartTimeChange = (nextStart: string) => {
    setCustomStartTime(nextStart);
    setSelectedSlot(null);
    if (nextStart && (!customEndTime || diffHm(nextStart, customEndTime) <= 0)) {
      setCustomEndTime(addMinutesHm(nextStart, defaultDurationMinutes));
    }
  };

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchSlots();
    }
  }, [selectedService, selectedDate, selectedProvider]);

  const fetchSlots = async () => {
    setSlotReason(null);
    // A time picked for another treatment/date/provider is no longer valid.
    setSelectedSlot(null);
    try {
      const res = await bookingAPI.getAvailability({
        clinicId,
        serviceId: selectedService,
        providerId: selectedProvider || undefined,
        date: selectedDate,
        // Past slots are only returned for admins (enforced by the server).
        allowPast: true,
      });
      const data = res.data;
      setAvailableSlots(data.slots || []);
      if (!data.slots?.length && data.reason) {
        setSlotReason(data.reason);
      }
    } catch (err: any) {
      console.error('Failed to fetch slots', err);
      setSlotReason(err.response?.data?.message || 'Could not fetch availability');
    }
  };

  const handleSubmit = async () => {
    if (!clientData.fullName || !clientData.phone) {
      setError('Please fill required fields (Name and Phone)');
      return;
    }
    if (!selectedSlot && !customStartTime) {
      setError('Please select a time slot or enter a custom start and end time');
      return;
    }

    const localDate = new Date(selectedDate + 'T00:00:00');
    const startDt = customStartTime
      ? createClinicUTCDateTime(localDate, customStartTime, clinicTimezone)
      : new Date(selectedSlot.startTime);

    let endDt: Date;
    if (customEndTime) {
      endDt = createClinicUTCDateTime(localDate, customEndTime, clinicTimezone);
    } else if (selectedSlot?.endTime) {
      endDt = new Date(selectedSlot.endTime);
    } else {
      endDt = new Date(startDt.getTime() + defaultDurationMinutes * 60000);
    }

    if (endDt.getTime() <= startDt.getTime()) {
      setError('End time must be after start time');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await bookingAPI.createAppointment({
        clinicId,
        serviceId: selectedService,
        providerId: selectedProvider || selectedSlot?.providerId || undefined,
        clientId: '00000000-0000-0000-0000-000000000000', // Backend handles walk-in via clientDetails
        startTime: startDt.toISOString(),
        endTime: endDt.toISOString(),
        clientDetails: clientData,
        notes: notes,
        disableNotifications: Boolean(disableNotifications),
        sendInvitation: Boolean(sendInvitation && !disableNotifications && !/^\s*(απ[όο]|from)\s+fresha\b/i.test(notes || '')),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    setCustomStartTime: handleCustomStartTimeChange,
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
    setSelectedSlot,
    slotReason,
    handleSubmit,
  };
};

export default useClinicBooking;
