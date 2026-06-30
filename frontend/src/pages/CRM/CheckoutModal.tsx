import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { completeAppointment } from '@/store/slices/bookingSlice';
import { X, Euro, CreditCard, Banknote, Gift } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import type { Appointment } from '@/types';
import { adminAPI } from '@/services/api';

interface CheckoutModalProps {
 appointment: Appointment | null;
 isOpen: boolean;
 onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ appointment, isOpen, onClose }) => {
 const dispatch = useDispatch<AppDispatch>();
 const { isLoading } = useSelector((state: RootState) => state.booking);

 const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gift_card'>('card');
 const [giftCardCode, setGiftCardCode] = useState('');
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

 if (paymentMethod === 'gift_card') {
 if (!giftCardCode.trim()) {
 alert('Please enter a Gift Card code.');
 return;
 }
 try {
 await adminAPI.redeemGiftCard({
 code: giftCardCode.trim(),
 amount: amountPaid
 });
 } catch (err: any) {
 console.error("Gift card redemption failed:", err);
 alert(err?.response?.data?.message || err?.message || 'Invalid or inactive Gift Card code.');
 return;
 }
 }

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
 <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
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
 <div className="space-y-3">
 <label className="text-sm font-semibold text-gray-700">Payment Method</label>
 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => setPaymentMethod('card')}
 className={`flex items-center justify-center gap-1.5 h-10 border rounded-lg font-bold text-xs transition-all ${paymentMethod === 'card' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
 >
 <CreditCard className="w-3.5 h-3.5" /> Card
 </button>
 <button
 type="button"
 onClick={() => setPaymentMethod('cash')}
 className={`flex items-center justify-center gap-1.5 h-10 border rounded-lg font-bold text-xs transition-all ${paymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
 >
 <Banknote className="w-3.5 h-3.5" /> Cash
 </button>
 <button
 type="button"
 onClick={() => setPaymentMethod('gift_card')}
 className={`flex items-center justify-center gap-1.5 h-10 border rounded-lg font-bold text-xs transition-all ${paymentMethod === 'gift_card' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
 >
 <Gift className="w-3.5 h-3.5" /> Gift Card
 </button>
 </div>

 {paymentMethod === 'gift_card' && (
 <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gift Card Code</label>
 <input
 type="text"
 required
 placeholder="Voucher Code (BD-XXXXXX)"
 value={giftCardCode}
 onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
 className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm tracking-wider bg-gray-50 uppercase placeholder-gray-300"
 />
 </div>
 )}
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
