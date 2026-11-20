import { useState, useEffect } from 'react';
import { clinicsAPI, bookingAPI } from '@/services/api';
import { format } from 'date-fns';

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
  const [customEndTime, setCustomEndTime] = useState('');

  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slotReason, setSlotReason] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && clinicId) {
      // A new booking ALWAYS starts empty: never carry over the treatment, provider, date,
      // time or busy slots of a previously opened appointment / clinic.
      setSelectedService('');
      setSelectedProvider('');
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setAvailableSlots([]);
      setSelectedSlot(null);
      setSlotReason(null);
      setNotes('');
      setDisableNotifications(false);
      setCustomEndTime('');
      setError(null);
      fetchClinicData();
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
  }, [isOpen, clinicId, prefillClient]);

  const fetchClinicData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, providersRes] = await Promise.all([
        clinicsAPI.getServices(clinicId),
        clinicsAPI.getProviders(clinicId),
      ]);
      setServices(servicesRes.data || []);
      setProviders(providersRes.data || []);
    } catch (err) {
      console.error('Failed to fetch clinic data', err);
    } finally {
      setIsLoading(false);
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
    if (!selectedSlot || !clientData.fullName || !clientData.phone) {
      setError('Please fill required fields (Name, Phone and Time slot)');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let computedEndIso = selectedSlot.endTime;
      if (customEndTime && selectedSlot.startTime) {
        const startDt = new Date(selectedSlot.startTime);
        const [eh, em] = customEndTime.split(':').map(Number);
        if (Number.isFinite(eh) && Number.isFinite(em)) {
          const endDt = new Date(startDt);
          endDt.setHours(eh, em, 0, 0);
          if (endDt.getTime() > startDt.getTime()) {
            computedEndIso = endDt.toISOString();
          }
        }
      }
      await bookingAPI.createAppointment({
        clinicId,
        serviceId: selectedService,
        providerId: selectedSlot.providerId || undefined,
        clientId: '00000000-0000-0000-0000-000000000000', // Backend handles walk-in via clientDetails
        startTime: selectedSlot.startTime,
        endTime: computedEndIso,
        clientDetails: clientData,
        notes: notes,
        disableNotifications: Boolean(disableNotifications),
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
    customEndTime,
    setCustomEndTime,
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
