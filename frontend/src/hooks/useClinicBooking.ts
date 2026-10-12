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
      const [servicesRes, clinicRes] = await Promise.all([
        clinicsAPI.getServices(clinicId),
        clinicsAPI.getById(clinicId),
      ]);
      setServices(servicesRes.data || []);
      setProviders(clinicRes.data.staff || []);
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
    try {
      const res = await bookingAPI.getAvailability({
        clinicId,
        serviceId: selectedService,
        providerId: selectedProvider || undefined,
        date: selectedDate,
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
      await bookingAPI.createAppointment({
        clinicId,
        serviceId: selectedService,
        providerId: selectedSlot.providerId,
        clientId: '00000000-0000-0000-0000-000000000000', // Backend handles walk-in via clientDetails
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        clientDetails: clientData,
        notes: notes,
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
