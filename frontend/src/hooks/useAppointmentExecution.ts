import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { updateAppointmentStatus, completeAppointment } from '@/store/slices/clinicSlice';
import { PaymentMethod, Appointment, Service, AppointmentStatus } from '@/types/clinic.types';
import { clinicsAPI, loyaltyAPI, bookingAPI } from '@/services/api';

export interface UseAppointmentExecutionOptions {
  appointment: Appointment;
  onClose: () => void;
  onComplete: () => void;
}

export const useAppointmentExecution = ({
  appointment,
  onClose,
  onComplete,
}: UseAppointmentExecutionOptions) => {
  const dispatch = useDispatch<AppDispatch>();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [giftCardCodeInput, setGiftCardCodeInput] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number } | null>(null);
  const [isValidatingCard, setIsValidatingCard] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number>(Number(appointment.totalAmount || (appointment.service?.price || 0)));
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Services & loyalty data
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    [appointment?.serviceId, ...(appointment?.additionalServiceIds || [])].filter((id) => !!id) as string[]
  );
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  useEffect(() => {
    fetchClinicData();
    fetchClientPoints();
  }, []);

  const fetchClinicData = async () => {
    try {
      const res = await clinicsAPI.getServices(appointment.clinicId);
      setServices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch services', err);
    }
  };

  const fetchClientPoints = async () => {
    try {
      const clientId = appointment.clientId || (appointment.client as any)?.id;
      if (!clientId) return;
      const res = await loyaltyAPI.getBalance(clientId, appointment.clinicId);
      setPointsBalance(res.data?.totalPoints || 0);
    } catch (err) {
      console.error('Failed to fetch points', err);
    }
  };

  // Recalculate when service selection changes
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const next = prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];

      if (next.length === 0) return [appointment.serviceId];

      const total = services
        .filter((s) => next.includes(s.id))
        .reduce((sum, s) => sum + Number(s.price), 0);
      setFinalAmount(total);
      return next;
    });
  };

  // Calculate total Euro sum
  const calculateTotal = (): number => {
    const baseAmount = finalAmount;
    const pointsReduction = pointsToRedeem;
    const preAppliedGiftCardReduction = appointment.giftCardAmountRedeemed || 0;
    const newlyAppliedGiftCardReduction = appliedGiftCard
      ? Math.min(appliedGiftCard.balance, Math.max(0, baseAmount - pointsReduction - preAppliedGiftCardReduction))
      : 0;

    return Math.max(0, baseAmount - pointsReduction - preAppliedGiftCardReduction - newlyAppliedGiftCardReduction);
  };

  const handleValidateGiftCard = async () => {
    if (!giftCardCodeInput.trim()) return;
    setIsValidatingCard(true);
    try {
      const res = await bookingAPI.validateGiftCard(giftCardCodeInput.trim());
      if (res && res.valid) {
        setAppliedGiftCard({ code: giftCardCodeInput.trim(), balance: res.balance });
        setGiftCardCodeInput('');
      } else {
        alert('Invalid or inactive Gift Card.');
        setAppliedGiftCard(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to validate Gift Card.');
      setAppliedGiftCard(null);
    } finally {
      setIsValidatingCard(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    status: AppointmentStatus = AppointmentStatus.COMPLETED
  ) => {
    e.preventDefault();
    if (new Date(appointment.startTime).getTime() > Date.now()) {
      alert('Completion, no-show and payment are possible from the appointment start time.');
      return;
    }
    if (pointsToRedeem > pointsBalance) {
      alert(`Insufficient points! Client only has ${pointsBalance} points.`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        notes: treatmentNotes,
        treatmentDetails: {
          originalServiceId: appointment.serviceId,
          actualServiceIds: selectedServiceIds,
          actualServiceNames: services
            .filter((s) => selectedServiceIds.includes(s.id))
            .map((s) => s.treatment?.name || 'Service'),
          pointsRedeemed: pointsToRedeem,
          notes: treatmentNotes,
          executedAt: new Date().toISOString(),
        },
        serviceId: selectedServiceIds[0],
        additionalServiceIds: selectedServiceIds.slice(1),
        totalAmount: calculateTotal(),
        amountPaid: (appointment.paymentMethod === 'CARD' && appointment.appointmentSource === 'platform_broker' && Number(appointment.amountPaid) > 0) 
          ? Number(appointment.amountPaid) 
          : calculateTotal(),
        paymentMethod: (appointment.paymentMethod === 'CARD' && appointment.appointmentSource === 'platform_broker')
          ? appointment.paymentMethod
          : paymentMethod,
        rewardPointsRedeemed: pointsToRedeem,
        giftCardCode: appliedGiftCard?.code,
      };

      // 1. Redeem points if any
      if (pointsToRedeem > 0) {
        const clientId = appointment.clientId || (appointment.client as any)?.id;
        await loyaltyAPI.redeemPoints({
          clientId: clientId,
          clinicId: appointment.clinicId,
          points: pointsToRedeem,
          description: `Loyalty Redemption for apt #${appointment.id.slice(0, 8)}`,
        });
      }

      // 2. Perform status update (Execution)
      if (status === AppointmentStatus.COMPLETED || status === AppointmentStatus.EXECUTED) {
        await dispatch(
          completeAppointment({
            id: appointment.id,
            data: updateData,
          })
        ).unwrap();
      } else {
        await dispatch(
          updateAppointmentStatus({
            id: appointment.id,
            status: status,
            updateData,
          })
        ).unwrap();
      }

      onComplete();
    } catch (error) {
      console.error('Clinical action failed:', error);
      alert('Failed to process clinical action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    paymentMethod,
    setPaymentMethod,
    giftCardCodeInput,
    setGiftCardCodeInput,
    appliedGiftCard,
    setAppliedGiftCard,
    isValidatingCard,
    finalAmount,
    setFinalAmount,
    treatmentNotes,
    setTreatmentNotes,
    isSubmitting,
    services,
    selectedServiceIds,
    pointsBalance,
    pointsToRedeem,
    setPointsToRedeem,
    toggleService,
    calculateTotal,
    handleValidateGiftCard,
    handleSubmit,
  };
};

export default useAppointmentExecution;
