import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { completeAppointment } from '@/store/slices/bookingSlice';
import { X, Euro, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import type { Appointment } from '@/types';

interface CheckoutModalProps {
    appointment: Appointment | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ appointment, isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.booking);

    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
    const [amountPaid, setAmountPaid] = useState<number>(appointment?.service?.price || 0);

    // Update amount if appointment changes
    React.useEffect(() => {
        if (appointment) {
            setAmountPaid(appointment.service?.price || 0);
        }
    }, [appointment]);

    if (!isOpen || !appointment) return null;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await dispatch(completeAppointment({
                id: appointment.id,
                data: {
                    paymentMethod,
                    amountPaid,
                    totalAmount: appointment.totalAmount || amountPaid,
                    serviceExecuted: true
                }
            })).unwrap();

            onClose();
        } catch (error: any) {
            console.error('Checkout error:', error);
            alert(error?.message || 'Failed to complete checkout');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Euro className="w-5 h-5 text-emerald-500" />
                        Checkout
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 rounded-full p-2 border border-gray-200/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCheckout} className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-sm text-gray-500 font-medium mb-1">Service</div>
                        <div className="font-bold text-gray-900">{appointment.service?.name || 'Service'}</div>
                        <div className="text-sm text-gray-500 font-medium mt-3 mb-1">Client</div>
                        <div className="font-bold text-gray-900">{appointment.client?.firstName} {appointment.client?.lastName}</div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Total Amount</label>
                        <div className="relative">
                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={amountPaid}
                                onChange={e => setAmountPaid(Number(e.target.value))}
                                className="w-full h-10 pl-10 pr-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`flex items-center justify-center gap-2 h-10 border rounded-lg font-bold text-sm transition-all ${paymentMethod === 'card' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <CreditCard className="w-4 h-4" /> Card
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex items-center justify-center gap-2 h-10 border rounded-lg font-bold text-sm transition-all ${paymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Banknote className="w-4 h-4" /> Cash
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 font-bold" disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Complete & Pay'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
