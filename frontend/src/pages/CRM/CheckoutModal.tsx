import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { completeAppointment } from '@/store/slices/bookingSlice';
import { X, Euro, CreditCard, Banknote, Gift } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import type { Appointment } from '@/types';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
 appointment: Appointment | null;
 isOpen: boolean;
 onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ appointment, isOpen, onClose }) => {
 const dispatch = useDispatch<AppDispatch>();
 const { isLoading } = useSelector((state: RootState) => state.booking);

  const totalAmount = Number(appointment?.totalAmount ?? appointment?.service?.price ?? 0);
  const alreadyPaid = Number((appointment as any)?.amountPaid ?? 0);
  const remainingBalance = Math.max(0, Number((totalAmount - alreadyPaid).toFixed(2)));

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gift_card'>('card');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(remainingBalance || totalAmount);

  // Update amount if appointment changes: ask only for remaining balance (QA #43)
  React.useEffect(() => {
    if (appointment) {
      const tot = Number(appointment.totalAmount ?? appointment.service?.price ?? 0);
      const paid = Number((appointment as any).amountPaid ?? 0);
      const bal = Math.max(0, Number((tot - paid).toFixed(2)));
      setAmountPaid(bal > 0 ? bal : tot);
    }
  }, [appointment]);

 if (!isOpen || !appointment) return null;

 const handleCheckout = async (e: React.FormEvent) => {
 e.preventDefault();

 if (paymentMethod === 'gift_card') {
 if (!giftCardCode.trim()) {
 toast.error('Please enter a Gift Card code.');
 return;
 }
 try {
 await adminAPI.redeemGiftCard({
 code: giftCardCode.trim(),
 amount: amountPaid
 });
 } catch (err: any) {
 console.error("Gift card redemption failed:", err);
 toast.error(err?.response?.data?.message || err?.message || 'Invalid or inactive Gift Card code.');
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
 toast.error(error?.message || 'Failed to complete checkout');
 }
 };

 return (
 <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
 <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
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

 {/* Total - Paid - Balance Breakup (QA #43) */}
 <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-200">
 <div>
 <div className="text-[10px] font-bold uppercase text-slate-400">Total</div>
 <div className="font-bold text-slate-900">€{totalAmount.toFixed(2)}</div>
 </div>
 <div>
 <div className="text-[10px] font-bold uppercase text-emerald-600">Paid</div>
 <div className="font-bold text-emerald-700">€{alreadyPaid.toFixed(2)}</div>
 </div>
 <div>
 <div className="text-[10px] font-bold uppercase text-amber-600">Balance</div>
 <div className="font-bold text-amber-700">€{remainingBalance.toFixed(2)}</div>
 </div>
 </div>

 {/* Amount */}
 <div className="space-y-1.5">
 <label className="text-sm font-semibold text-gray-700">
 {alreadyPaid > 0 && remainingBalance > 0 ? 'Balance to Pay (€)' : 'Amount to Pay (€)'}
 </label>
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
