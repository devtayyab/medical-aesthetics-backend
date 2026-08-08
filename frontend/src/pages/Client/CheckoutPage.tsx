import React, { useState, useEffect } from"react";
import { css } from"@emotion/css";
import VISA from"@/assets/Visa.png";
import AMEX from"@/assets/Amex.png";
import { Button } from"@/components/atoms/Button/Button";
import { FaCheckCircle, FaShieldAlt, FaChevronLeft, FaInfoCircle, FaLock } from"react-icons/fa";
import { useNavigate, useLocation } from"react-router-dom";
import { useDispatch, useSelector } from"react-redux";
import { createAppointment, clearBooking } from"@/store/slices/bookingSlice";
import type { RootState, AppDispatch } from"@/store";
import { Input } from"@/components/atoms/Input/Input";
import { format } from"date-fns";
import { paymentsAPI } from"@/services/api";
import { FaGift } from"react-icons/fa";

const formatClinicTime = (dateStr: string | Date, timezone?: string) => {
    const d = new Date(dateStr);
    try {
        if (!timezone) throw new Error("No timezone");
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(d);
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
        const normalizedHour = hour === 24 ? 0 : hour;
        return `${normalizedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    } catch (e) {
        return format(d, "HH:mm");
    }
};

const containerStyle = css`
 max-width: 1200px;
 margin: 0 auto;
 padding: 12px 0.75rem 32px 0.75rem;
 @media (min-width: 640px) {
 padding: 32px 1rem;
 }
`;

const cardStyle = css`
 background: white;
 border-radius: 20px;
 padding: 16px 14px;
 @media (min-width: 640px) {
 border-radius: 24px;
 padding: 32px;
 }
 box-shadow: 0 10px 40px rgba(0,0,0,0.04);
 border: 1px solid #f0f0f0;
`;

const sectionTitle = css`
 font-size: 16px;
 @media (min-width: 640px) {
 font-size: 20px;
 }
 font-weight: 900;
 text-transform: uppercase;
 margin-bottom: 16px;
 @media (min-width: 640px) {
 margin-bottom: 24px;
 }
 display: flex;
 align-items: center;
 gap: 10px;
 color: #1a202c;
`;

export const CheckoutPage: React.FC = () => {
 const dispatch = useDispatch<AppDispatch>();
 const navigate = useNavigate();
 const location = useLocation();
 const crmState = (location.state || {}) as any;
 const { selectedClinic, selectedServices, selectedDate, selectedTimeSlot, holdId } = useSelector((state: RootState) => state.booking);
 const { user } = useSelector((state: RootState) => state.auth);

 const [paymentMethod, setPaymentMethod] = useState<'card' | 'venue' | 'paypal'>('card');
 const [giftCardCode, setGiftCardCode] = useState('');
 const [appliedGiftCard, setAppliedGiftCard] = useState<{ valid: boolean; balance: number; code: string; id: string } | null>(null);
 const [isApplyingGiftCard, setIsApplyingGiftCard] = useState(false);
 const [formData, setFormData] = useState({
 fullName: crmState.customerName || crmState.name || '',
 email: crmState.customerEmail || crmState.email || '',
 phone: crmState.customerPhone || crmState.phone || '',
 });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [hasConsented, setHasConsented] = useState(false);

 const totalAmount = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);
 const discountAmount = appliedGiftCard ? Math.min(totalAmount, appliedGiftCard.balance) : 0;
 const payableAmount = totalAmount - discountAmount;

 useEffect(() => {
 // Redirect if state is missing (e.g. on refresh)
 if (!selectedClinic || !selectedServices.length || !selectedDate || !selectedTimeSlot) {
 console.warn('Booking state missing, redirecting to search');
 // Allow a small delay for state to potentially hydrate if needed, 
 // but usually this means we lost the wizard state.
 const timer = setTimeout(() => {
 if (!selectedClinic) navigate('/search');
 }, 100);
 return () => clearTimeout(timer);
 }
 }, [selectedClinic, selectedServices, selectedDate, selectedTimeSlot, navigate]);

 useEffect(() => {
 if (user) {
 setFormData(prev => ({
 fullName: prev.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
 email: prev.email || user.email || '',
 phone: prev.phone || user.phone || (user as any).phoneNumber || (user as any).mobile || localStorage.getItem('lastUsedPhone') || ''
 }));
 } else if (!formData.phone) {
 const savedPhone = localStorage.getItem('lastUsedPhone');
 if (savedPhone) {
 setFormData(prev => ({ ...prev, phone: savedPhone }));
 }
 }
 }, [user]);

 const handleCompleteBooking = async () => {
 if (!selectedClinic || !selectedServices.length || !selectedDate || !selectedTimeSlot) return;

 if (!formData.phone) {
 alert('Mobile number is mandatory for appointment booking.');
 return;
 }

 // The consent button below is not a form submit, so the checkbox `required` attribute never
 // fires — enforce it explicitly so a booking cannot complete without agreement (compliance).
 if (!hasConsented) {
 alert('Please agree to the Terms of Service and consent to communications to continue.');
 return;
 }

 // Save phone to localStorage for future use
 localStorage.setItem('lastUsedPhone', formData.phone);

 setIsSubmitting(true);
 try {
 if (!formData.fullName || !formData.email) {
 alert('Please provide your full name and email address.');
 setIsSubmitting(false);
 return;
 }


 const appointmentData = {
 clinicId: selectedClinic.id,
 serviceId: selectedServices[0].id,
 additionalServiceIds: selectedServices.slice(1).map(s => s.id),
 clientId: crmState?.customerId || user?.id || '00000000-0000-0000-0000-000000000000',
 providerId: selectedTimeSlot?.providerId || undefined,
 startTime: selectedTimeSlot.startTime,
 endTime: selectedTimeSlot.endTime,
 status: 'PENDING',
 paymentMethod: payableAmount <= 0 ? 'gift_card' : paymentMethod,
 clientDetails: formData,
 holdId,
 giftCardCode: appliedGiftCard?.code || undefined
 };

 const result = await dispatch(createAppointment(appointmentData));
 if (result.meta.requestStatus === 'fulfilled') {
 const payload = { ...(result.payload as any) };

 if (payload.redirectUrl) {
 window.location.href = payload.redirectUrl;
 return;
 }

 // Append missing details for the confirmation page
 payload.serviceName = payload.service?.name || payload.serviceName || selectedServices[0]?.treatment?.name || selectedServices[0]?.name;
 payload.clinic = payload.clinic || selectedClinic;
 payload.startTimeDisplay = selectedTimeSlot.startTimeDisplay;

 dispatch(clearBooking());
 navigate('/booking-confirmation', { state: { appointment: payload } });
 } else {
 let errorMsg = (result.payload as any) || 'Failed to create appointment. Please try again.';
 if (typeof errorMsg === 'string' && errorMsg.includes('Client not found')) {
 errorMsg ="Your session expired or your account was not found. Please log out and back in to refresh your session.";
 }
 alert(errorMsg);
 }
 } catch (error: any) {
 console.error('Booking error:', error);
 alert('An unexpected error occurred: ' + (error.message || 'Unknown error'));
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="min-h-screen bg-[#F7FAFC]">
 <div className={containerStyle}>
  <div className="flex items-center justify-between mb-4 sm:mb-8 flex-wrap gap-2 sm:gap-4">
  <button onClick={() => navigate(-1)} className="group flex items-center gap-2 sm:gap-3 text-[9px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
  <div className="size-7 sm:size-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-all">
  <FaChevronLeft size={8} />
  </div>
  <span>Back</span>
  </button>
  <div className="flex items-center gap-2 sm:gap-4">
  <div className="flex flex-col items-center">
  <div className="size-7 sm:size-8 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px] sm:text-xs"><FaCheckCircle className="text-[#CBFF38]" /></div>
  <span className="text-[7px] sm:text-[9px] font-black uppercase mt-1 tracking-widest">Time</span>
  </div>
  <div className="w-4 sm:w-12 h-px bg-black -mt-4 opacity-20" />
  <div className="flex flex-col items-center">
  <div className="size-7 sm:size-8 rounded-full bg-[#CBFF38] text-black flex items-center justify-center font-black text-xs shadow-md">2</div>
  <span className="text-[7px] sm:text-[9px] font-black uppercase mt-1 tracking-widest">Details</span>
  </div>
  </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
  <div className="lg:col-span-8 space-y-4 sm:space-y-8">
  {/* Personal Details */}
  <div className={cardStyle}>
  <h3 className={sectionTitle}><FaCheckCircle size={18} className="text-lime-500" /> Personal Details</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
  <Input
  label="Full Name"
  value={formData.fullName}
  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
  placeholder="Enter your full name"
  className="rounded-xl sm:rounded-2xl h-11 sm:h-14"
  />
  <Input
  label="Email Address"
  value={formData.email}
  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  placeholder="your@email.com"
  className="rounded-xl sm:rounded-2xl h-11 sm:h-14"
  />
  <div className="md:col-span-2 space-y-3 sm:space-y-4">
  <Input
  label="Phone Number"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  placeholder="+44 7000 000000"
  className="rounded-xl sm:rounded-2xl h-11 sm:h-14"
  />

 <label className="flex items-start gap-3 cursor-pointer mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors group">
 <input
 type="checkbox"
 required
 checked={hasConsented}
 onChange={(e) => setHasConsented(e.target.checked)}
 className="mt-1 size-5 rounded border-gray-300 text-lime-500 focus:ring-lime-500 shrink-0"
 />
 <span className="text-xs text-gray-600 leading-relaxed group-hover:text-black">
 I consent to receiving booking confirmations, reminders, and updates via email and SMS. I also agree to the <a href="#" className="underline font-bold">Terms of Service</a> and <a href="#" className="underline font-bold">Privacy Policy</a>.
 </span>
 </label>
 </div>
 </div>
 </div>

 {/* Payment Method */}
 <div className={cardStyle}>
 <h3 className={sectionTitle}><FaShieldAlt size={18} className="text-lime-500" /> Payment Method</h3>
 <div className="space-y-4">
 <button
 type="button"
 onClick={() => setPaymentMethod('card')}
 className={`w-full flex flex-wrap items-center justify-between gap-y-2 p-4 sm:p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'card' ? 'border-[#CBFF38] bg-lime-50' : 'border-gray-100 hover:border-gray-200'}`}
 >
 <div className="flex items-center gap-4">
 <div className={`size-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-black bg-black' : 'border-gray-300'}`}>
 {paymentMethod === 'card' && <div className="size-2 rounded-full bg-[#CBFF38]" />}
 </div>
 <span className="font-black uppercase text-sm tracking-tight">Credit or Debit Card</span>
 </div>
 <div className="flex gap-2">
 <img src={VISA} alt="Visa" className="h-5" />
 <img src={AMEX} alt="Amex" className="h-5" />
 </div>
 </button>

 {paymentMethod === 'card' && (
 <div className="p-4 bg-lime-100/50 rounded-xl border border-lime-200">
 <p className="text-[10px] font-bold text-lime-700 uppercase tracking-tight leading-relaxed">
 SECURE CHECKOUT: You will be redirected to the secure Viva Wallet payment page after clicking"Finish & Book" at the bottom right.
 </p>
 </div>
 )}

 <button
 type="button"
 onClick={() => setPaymentMethod('venue')}
 className={`w-full flex flex-wrap items-center justify-between gap-y-2 p-4 sm:p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'venue' ? 'border-[#CBFF38] bg-lime-50' : 'border-gray-100 hover:border-gray-200'}`}
 >
 <div className="flex items-center gap-4">
 <div className={`size-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'venue' ? 'border-black bg-black' : 'border-gray-300'}`}>
 {paymentMethod === 'venue' && <div className="size-2 rounded-full bg-[#CBFF38]" />}
 </div>
 <span className="font-black uppercase text-sm tracking-tight">Pay at Venue</span>
 </div>
 <span className="text-[10px] font-black uppercase text-lime-600 bg-lime-100 px-3 py-1 rounded-full">Earn Points</span>
 </button>

 </div>
 </div>

 {/* Gift Card */}
 <div className={cardStyle}>
 <h3 className={sectionTitle}><FaGift size={18} className="text-lime-500" /> Apply Gift Card</h3>
 {appliedGiftCard ? (
 <div className="p-4 bg-lime-50 border border-lime-200 rounded-xl flex items-center justify-between">
 <div>
 <p className="text-sm font-bold text-lime-800">Gift Card Applied: {appliedGiftCard.code}</p>
 <p className="text-xs text-lime-600 mt-1">Balance: €{appliedGiftCard.balance.toLocaleString()}</p>
 </div>
 <button 
 type="button" 
 onClick={() => { setAppliedGiftCard(null); setGiftCardCode(''); }}
 className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
 >
 Remove
 </button>
 </div>
 ) : (
 <div className="flex gap-3">
 <input
 type="text"
 placeholder="Enter Gift Card Code"
 value={giftCardCode}
 onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
 className="flex-1 h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] focus:border-[#CBFF38] outline-none font-bold text-sm tracking-wider uppercase"
 />
 <Button
 disabled={!giftCardCode.trim() || isApplyingGiftCard}
 onClick={async () => {
 setIsApplyingGiftCard(true);
 try {
 const res = await paymentsAPI.applyGiftCard(giftCardCode.trim());
 setAppliedGiftCard({ ...res.data, code: giftCardCode.trim() });
 alert("Gift card applied successfully!");
 } catch (err: any) {
 console.error("Gift card apply error:", err);
 alert(err?.response?.data?.message ||"Invalid or expired gift card code.");
 } finally {
 setIsApplyingGiftCard(false);
 }
 }}
 className="h-12 bg-black text-white hover:bg-gray-800 px-6 rounded-xl font-bold uppercase tracking-widest text-xs"
 >
 {isApplyingGiftCard ?"..." :"Apply"}
 </Button>
 </div>
 )}
 </div>

 {/* Policies */}
 <div className="flex gap-4 p-4 sm:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
 <FaInfoCircle className="text-gray-400 shrink-0" size={20} />
 <div className="space-y-4">
 <div>
 <h4 className="text-xs font-black uppercase text-gray-900 mb-1">Cancellation Policy</h4>
 <p className="text-xs text-gray-500 leading-relaxed">Free cancellation up to 24 hours before your start time. Within 24 hours, the clinic might charge a late fee.</p>
 </div>
 <div className="flex items-center gap-2 text-[10px] font-black text-lime-600 uppercase tracking-widest bg-lime-50 rounded-full px-4 py-1 self-start">
 <FaLock size={10} /> Secure Booking via TreatAesthetics
 </div>
 </div>
 </div>
 </div>

 {/* Summary Sidebar */}
 <div className="lg:col-span-4 sticky top-8">
 <div className={cardStyle}>
 <h3 className="text-xl font-black uppercase text-gray-900 mb-8 pb-4 border-b border-gray-100">Order Summary</h3>

 <div className="space-y-6 mb-12">
 <div>
 <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Clinic</h4>
 <p className="text-base font-black text-gray-900 uppercase">{selectedClinic?.name}</p>
 <p className="text-xs text-gray-500 mt-1">{selectedClinic?.address.city}, {selectedClinic?.address.zipCode}</p>
 </div>

 <div>
 <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Appointment</h4>
 <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
 <p className="text-sm font-black text-gray-900 uppercase mb-1">
 {selectedDate ? format(new Date(`${selectedDate}T00:00:00`),"EEEE, MMMM d") : 'Date not set'}
 </p>
 <p className="text-lg font-black text-lime-600">
 {selectedTimeSlot ? formatClinicTime(selectedTimeSlot.startTime, selectedClinic?.timezone) : '00:00'}
 </p>
 </div>
 </div>

 <div>
 <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Treatments</h4>
 <div className="space-y-2">
 {selectedServices.map(s => (
 <div key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
 <span className="text-xs font-black uppercase">{s.treatment?.name || s.name || 'Treatment'}</span>
 <span className="text-sm font-black text-gray-900"><span className="font-sans font-medium">€</span>{Number(s.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="border-t border-gray-100 pt-6 mb-8 space-y-3">
 <div className="flex justify-between items-center text-gray-500">
 <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
 <span className="text-lg font-black"><span className="font-sans mr-1">€</span>{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
 </div>
 {discountAmount > 0 && (
 <div className="flex justify-between items-center text-lime-600">
 <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
 <FaGift /> Gift Card Discount
 </span>
 <span className="text-lg font-black">-<span className="font-sans mr-1">€</span>{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
 </div>
 )}
 <div className="flex justify-between items-center pt-3 border-t border-gray-100">
 <span className="text-sm font-black uppercase text-gray-900 tracking-widest">Payable Amount</span>
 <span className="text-2xl md:text-3xl font-black text-gray-900"><span className="font-sans mr-1">€</span>{payableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
 </div>
 </div>

 <Button
 fullWidth
 disabled={isSubmitting || !selectedClinic}
 onClick={handleCompleteBooking}
 className="bg-[#CBFF38] text-black hover:bg-lime-400 h-16 rounded-2xl font-black uppercase tracking-widest text-base shadow-lg shadow-lime-200"
 >
 {isSubmitting ?"Processing..." :"Finish & Book"}
 </Button>

 <p className="text-[9px] text-center text-gray-400 mt-6 uppercase font-bold tracking-widest leading-relaxed">
 By completing this booking, you agree to our terms of service and the clinic's own cancellation policy.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
