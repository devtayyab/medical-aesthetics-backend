import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { completeAppointment } from '../../store/slices/clinicSlice';
import { PaymentMethod, Appointment } from '../../types/clinic.types';
import { X, DollarSign, CreditCard, Banknote, Building2 } from 'lucide-react';

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
  const [finalAmount, setFinalAmount] = useState<number>(appointment.totalAmount);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await dispatch(
        completeAppointment({
          id: appointment.id,
          data: {
            paymentData: {
              paymentMethod,
              amount: finalAmount,
              notes: treatmentNotes,
              isAdvancePayment: false,
            },
            treatmentDetails: {
              notes: treatmentNotes,
              completedAt: new Date().toISOString(),
            },
          },
        })
      ).unwrap();

      onComplete();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
      alert('Failed to complete appointment. Please try again.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Execute Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Client</p>
                <p className="font-medium text-gray-900">
                  {appointment.client?.firstName} {appointment.client?.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Service</p>
                <p className="font-medium text-gray-900">{appointment.service?.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Date & Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(appointment.startTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Original Amount</p>
                {/* <p className="font-medium text-gray-900">${appointment.totalAmount.toFixed(2)}</p> */}
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === method.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={
                      paymentMethod === method.value ? 'text-blue-600' : 'text-gray-400'
                    }
                  >
                    {method.icon}
                  </div>
                  <span
                    className={`font-medium ${
                      paymentMethod === method.value ? 'text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Final Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalAmount}
                onChange={(e) => setFinalAmount(parseFloat(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                required
              />
            </div>
            {finalAmount !== appointment.totalAmount && (
              <p className="text-sm text-amber-600 mt-2">
                {/* Amount modified from original ${appointment.totalAmount.toFixed(2)} */}
              </p>
            )}
          </div>

          {/* Treatment Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Notes
            </label>
            <textarea
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              rows={4}
              placeholder="Add any notes about the treatment, client feedback, or observations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Complete & Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentExecutionModal;
