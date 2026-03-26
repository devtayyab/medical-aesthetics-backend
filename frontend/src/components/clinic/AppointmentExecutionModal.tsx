import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { updateAppointmentStatus } from '../../store/slices/clinicSlice';
import { PaymentMethod, Appointment, Service, AppointmentStatus } from '../../types/clinic.types';
import { X, DollarSign, CreditCard, Banknote, Building2, Gift, RefreshCw, AlertTriangle } from 'lucide-react';
import { clinicsAPI, loyaltyAPI } from '@/services/api';

interface AppointmentExecutionModalProps {
  appointment: Appointment;
  onClose: () => void;
  onComplete: () => void;
}

const AppointmentExecutionModal: React.FC<AppointmentExecutionModalProps> = ({
  appointment,
  onClose,
  onComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [finalAmount, setFinalAmount] = useState<number>(appointment.totalAmount || 0);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New features
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(appointment.serviceId);
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
      const res = await loyaltyAPI.getBalance(appointment.clientId, appointment.clinicId);
      setPointsBalance(res.data?.totalPoints || 0);
    } catch (err) {
      console.error('Failed to fetch points', err);
    }
  };

  // Recalculate when service changes
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFinalAmount(service.price);
      setPointsToRedeem(0); // Reset points when service changes
    }
  };

  // Calculate total Euro sum
  const calculateTotal = () => {
    const baseAmount = finalAmount;
    // Assume 1 point = 1 Euro reduction for now, or just subtract directly
    const pointsReduction = pointsToRedeem;
    return Math.max(0, baseAmount - pointsReduction);
  };

  const handleSubmit = async (e: React.FormEvent, status: AppointmentStatus = AppointmentStatus.EXECUTED) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: any = {
        notes: treatmentNotes,
        treatmentDetails: {
          originalServiceId: appointment.serviceId,
          actualServiceId: selectedServiceId,
          pointsRedeemed: pointsToRedeem,
          notes: treatmentNotes,
          executedAt: new Date().toISOString(),
        },
        serviceId: selectedServiceId,
        totalAmount: calculateTotal(),
        rewardPointsRedeemed: pointsToRedeem,
      };

      // 1. Redeem points if any
      if (pointsToRedeem > 0) {
        await loyaltyAPI.redeemPoints({
          clientId: appointment.clientId,
          clinicId: appointment.clinicId,
          points: pointsToRedeem,
          description: `Loyalty Redemption for apt #${appointment.id.slice(0, 8)}`
        });
      }

      // 2. Perform status update (Execution)
      await dispatch(
        updateAppointmentStatus({
          id: appointment.id,
          status: status,
          updateData
        })
      ).unwrap();

      onComplete();
    } catch (error) {
      console.error('Clinical action failed:', error);
      alert('Failed to process clinical action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Cash', icon: <Banknote className="w-5 h-5" /> },
    { value: PaymentMethod.POS, label: 'POS', icon: <CreditCard className="w-5 h-5" /> },
    { value: PaymentMethod.CARD, label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: <Building2 className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-t-8 border-green-600">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Execute Appointment</h2>
            <p className="text-sm text-gray-500">Record treatment details and payment</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Appointment/Service Edit */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Treatment Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">SERVICE PERFORMED</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.treatment?.name || 'Unknown Service'} - €{s.price}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">BASE PRICE (€)</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Rewards */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Reward Points</h3>
              </div>
              <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                {pointsBalance} pts Available
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-amber-700 mb-2">Redeem points for a discount (€1 = 1pt)</p>
                <input
                  type="range"
                  min="0"
                  max={Math.min(pointsBalance, finalAmount)}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>
              <div className="w-24 text-center bg-white border border-amber-200 rounded-lg p-2">
                <p className="text-[10px] font-bold text-amber-600 uppercase">Discount</p>
                <p className="text-lg font-bold text-amber-900">-€{pointsToRedeem}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex items-center gap-2 p-3 border-2 rounded-xl transition-all ${paymentMethod === method.value
                      ? 'border-green-600 bg-green-50 ring-2 ring-green-100'
                      : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    <div className={paymentMethod === method.value ? 'text-green-600' : 'text-gray-400'}>
                      {method.icon}
                    </div>
                    <span className={`text-sm font-bold ${paymentMethod === method.value ? 'text-green-900' : 'text-gray-600'}`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total Recalculation */}
            <div className="bg-gray-900 rounded-xl p-5 text-white flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1 text-gray-400 text-sm">
                <span>Sum Recalculated</span>
                <RefreshCw className="w-3 h-3" />
              </div>
              <div className="text-3xl font-bold flex items-center justify-between">
                <span>Total Due:</span>
                <span className="text-green-400">€{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="mt-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest text-right">
                (inc. all taxes & discounts)
              </div>
            </div>
          </div>

          {/* Treatment Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Treatment & Clinical Notes
            </label>
            <textarea
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              rows={3}
              placeholder="Add any medical notes, follow-up advice, or variations from original booked service..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-bold"
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, AppointmentStatus.NO_SHOW)}
              className="px-6 py-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold flex items-center gap-2"
              disabled={isSubmitting}
            >
              <AlertTriangle size={16} /> No Show
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2 group"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finalizing...' : (
                <>
                  Executed
                  <RefreshCw className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentExecutionModal;
