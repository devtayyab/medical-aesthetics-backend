import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import VISA from "@/assets/Visa.png";
import AMEX from "@/assets/Amex.png";
import Mastercard from "@/assets/paypal.png";
import Paypal from "@/assets/container.png";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { FaArrowRightLong, FaClock } from "react-icons/fa6";
import { BiError } from "react-icons/bi";
import { Input } from "@/components/atoms/Input/Input";
import BookingNoteModal from '@/components/Modal/BookingNoteModal';
import { Select } from "@/components/atoms/Select/Select";
import { FaBackspace, FaBackward, FaCheckCircle, FaChevronLeft, FaShieldAlt, FaMoneyBillWave } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { createAppointment, clearBooking } from "@/store/slices/bookingSlice";
import type { RootState, AppDispatch } from "@/store";
// Custom class for rounded bottom corners only
const roundedBottomCorners = css`
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`;

const roundedTopCorners = css`
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius:  0.5rem;
  border-top-right-radius:  0.5rem;
`;
export const CheckoutPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { selectedClinic, selectedServices, selectedDate, selectedTimeSlot, isLoading, error } = useSelector((state: RootState) => state.booking);
    const { user } = useSelector((state: RootState) => state.auth);

    const [isBookingNoteOpen, setBookingNoteOpen] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');
    const [bookingNote, setBookingNote] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        countryCode: '+44'
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveNote = (note: string) => {
        setBookingNote(note);
        setBookingNoteOpen(false);
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^[\d\s\-\(\)]+$/.test(formData.phone)) {
            errors.phone = 'Phone number is invalid';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCompleteBooking = async () => {
        if (!validateForm()) {
            // Scroll to first error field
            const firstErrorField = document.querySelector('[data-error="true"]');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (!selectedClinic || !selectedServices.length || !selectedDate || !selectedTimeSlot) {
            console.log('Missing booking information. Please start over.', selectedClinic, selectedServices, selectedDate, selectedTimeSlot);
            alert('Missing booking information. Please start over.');
            return;
        }

        setIsSubmitting(true);
        console.log(`${selectedDate} ${selectedTimeSlot.startTime}`)
        try {
            const appointmentData = {
                clinicId: selectedClinic.id,
                serviceId: selectedServices[0].id, // Assuming single service for now
                clientId: user?.id || 'guest',
                providerId: user?.id,
                startTime: new Date(`${selectedTimeSlot.startTime}`)?.toISOString(),
                endTime: new Date(`${selectedTimeSlot.endTime}`)?.toISOString(),
                notes: bookingNote,
                paymentMethod: 'card',
                clientDetails: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: `${formData.countryCode}${formData.phone}`
                }
            };

            const result = await dispatch(createAppointment(appointmentData));
            console.log('Booking result:', result);
            if (result.meta.requestStatus === 'fulfilled') {
                // Success - redirect to confirmation page
                dispatch(clearBooking());
                navigate('/booking-confirmation', {
                    state: {
                        appointment: {
                            ...result.payload,
                            clientDetails: appointmentData.clientDetails
                        }
                    }
                });
            } else {
                console.error('Booking failed:', result);
            }
        } catch (error) {
            console.error('Booking error:', error);
        } finally {


            setIsSubmitting(false);

        }

    };

    useEffect(() => {
        // Pre-fill form data if user is logged in
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'John Doe',
                email: user.email || 'john@gmail.com',
                phone: user.phone || ''
            }));
        }

        // Debug: Log current booking state
        console.log('Current booking state:', {
            selectedClinic,
            selectedServices,
            selectedDate,
            selectedTimeSlot,
            user
        });
    }, [user, selectedClinic, selectedServices, selectedDate, selectedTimeSlot]);

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCardNumber(e.target.value);
    };

    const handleExpirationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExpirationDate(e.target.value);
    };

    const handleSecurityCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSecurityCode(e.target.value);
    };

    const handleNameOnCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNameOnCard(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Card details:', cardNumber, expirationDate, securityCode, nameOnCard);
        // You can send the card details to backend here
    };

    return (
        <section
            className="relative bg-cover bg-center min-h-screen px-4 py-8 md:py-[60px]"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >


            <div className="flex max-w-7xl mx-auto  items-center text-[#33373F] text-[15px] font-medium mb-6">
                <Link
                    to="/search"
                    className=""
                >
                    <span className="px-4 flex">
                        <FaChevronLeft size={16} className="pt-[6px] text-[#767676]" />  <span>Back</span>
                    </span>

                </Link>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="md:col-span-2 space-y-6">
                    {/* Personal Details Card */}
                    <Card className="p-4 md:p-8 rounded-xl shadow-lg bg-white border border-gray-100">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 bg-lime-400 from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4">
                                {user ? (user.firstName || user.email)[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Your details</h2>
                                <p className="text-sm text-gray-600">
                                    {user ? (
                                        <>Welcome back {user.firstName || user.email.split('@')[0]}, not your?{" "}
                                            <Link to="/auth/logout" className="text-blue-600 hover:text-blue-700 underline font-medium">
                                                Signout
                                            </Link>
                                        </>
                                    ) : (
                                        "Please provide your details for booking"
                                    )}
                                </p>
                            </div>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <Input
                                    label=" Full Name"
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    data-error={!!formErrors.fullName}
                                    className={formErrors.fullName ? 'border-red-500' : ''}
                                />
                                {formErrors.fullName && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                                )}
                            </div>
                            <div>
                                <Input
                                    label="Email"
                                    id="email"
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    data-error={!!formErrors.email}
                                    className={formErrors.email ? 'border-red-500' : ''}
                                />
                                {formErrors.email && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        id="countryCode"
                                        name="countryCode"
                                        value={formData.countryCode}
                                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                                        className="rounded-md border border-gray-100 shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none"
                                    >
                                        <option>+44</option>
                                        <option>+1</option>
                                        <option>+91</option>
                                    </select>

                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="Enter phone number"
                                        data-error={!!formErrors.phone}
                                        className={`flex-grow mt-1 rounded-md shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none ${formErrors.phone ? 'border-red-500' : ''
                                            }`}
                                    />
                                </div>
                                {formErrors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                                )}
                            </div>
                            <div>
                                <a
                                    href="#"
                                    className="text-blue-600 flex items-center gap-1 text-sm cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setBookingNoteOpen(true);
                                    }}
                                >
                                    <BiError className="text-blue-600" /> Add a booking note
                                </a>
                            </div>
                        </form>
                    </Card>

                    {/* Beauty Points Discount Card */}
                    <Card className="p-4 md:p-6 rounded-xl shadow-lg bg-lime-100 from-purple-50 to-pink-50 border border-purple-200">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-lime-200 from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mr-3">
                                <FaCheckCircle className="text-lg" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                Beauty Points Discount
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Use Beauty Points to get a discount on this treatment
                        </p>
                        <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                            <p className="text-lg font-semibold text-purple-700">You have {0} Beauty Points</p>
                            <p className="text-sm text-purple-600">Save €{(0) / 10} on this treatment</p>
                        </div>
                        <Button variant="outline" className="text-purple-700 border-purple-300 hover:bg-purple-50">
                            Apply Them Now?
                            <FaArrowRightLong />
                        </Button>
                    </Card>
                    {/* Payment Card */}
                    <Card className="p-4 md:p-8 rounded-xl shadow-lg bg-white border border-gray-100">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-lime-400 from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                                <FaShieldAlt className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Payment</h3>
                                <p className="text-sm text-gray-600">All transactions are secured and encrypted</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="">
                            <label className={`flex items-center justify-between cursor-pointer border border-[#1773B0] bg-[#EFF5FF] p-4 ${roundedTopCorners}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="paymentMethod" value="card" className="w-6 h-6 border-2 border-blue-400 checked:bg-blue-500 checked:border-blue-500" defaultChecked />
                                    <span className="text-base font-medium">Credit or debit card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={VISA} alt="Visa" className="h-6" />
                                    <img src={Mastercard} alt="Mastercard" className="h-6" />
                                    <img src={AMEX} alt="Amex" className="h-6" />
                                </div>
                            </label>
                            <div className="space-y-3">
                                <fieldset className={`border p-5 bg-[#F5F5F5] ${roundedBottomCorners}`}>


                                    <div className="mt-4 space-y-4">
                                        <Input
                                            type="text"
                                            placeholder="Card number"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            className=""
                                        />
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Input
                                                type="text"
                                                placeholder="Expiration date"
                                                value={expirationDate}
                                                onChange={handleExpirationDateChange}
                                                className="flex-1 text-base placeholder-gray-400"
                                            />
                                            <Input
                                                type="text"
                                                placeholder="Security code"
                                                value={securityCode}
                                                onChange={handleSecurityCodeChange}
                                                className="flex-1 text-base placeholder-gray-400"
                                            />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Name on card"
                                            value={nameOnCard}
                                            onChange={handleNameOnCardChange}
                                            className="text-base placeholder-gray-400"
                                        />
                                    </div>
                                </fieldset>

                                <fieldset className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="radio" name="paymentMethod" value="paypal" className="w-5 h-5" />
                                        <span className="flex-grow">PayPal <span className="bg-green-200 text-xs rounded-full px-2 ml-4 py-0.5">90 points</span></span>

                                        <img src={Paypal} alt="PayPal" className="h-5 ml-2" />
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="radio" name="paymentMethod" value="venue" className="w-5 h-5" />
                                        <span className="flex-grow">Pay at venue
                                            <span className="bg-green-200 text-xs rounded-full ml-4 px-2 py-0.5">90 points</span>
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer border-t border-gray-100 pt-3 mt-2">
                                        <input type="radio" name="paymentMethod" value="cash" className="w-5 h-5" />
                                        <span className="flex-grow flex items-center gap-2">
                                            Cash payment
                                            <span className="bg-gray-100 text-xs text-gray-500 rounded-full px-2 py-0.5">Pay at clinic</span>
                                        </span>
                                        <FaMoneyBillWave className="h-5 text-green-600" />
                                    </label>
                                </fieldset>

                                <fieldset className="space-y-4 mt-6 text-sm text-gray-600">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4" />
                                        I consent to my data being used for booking this medical treatment in accordance with GDPR.
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4" />
                                        Email me receipt and reminders
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        By continuing you agree to our <a href="#" className="text-blue-600 underline">Booking Terms</a>
                                    </label>
                                </fieldset>
                                <button type="submit" className="w-full bg-lime-400 text-black font-bold py-2 rounded hover:bg-lime-500 transition">
                                    Pay with card
                                </button>
                            </div>
                        </form>
                    </Card>
                    {/* Venue Policies Card */}
                    <Card className="p-4 md:p-8 rounded-xl shadow-lg bg-white border border-gray-100">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-lime-400 from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white mr-3">
                                <FaClock className="text-lg" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                Venue policies
                            </h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Reschedule policy</h4>
                                <p className="text-sm text-gray-500">
                                    Free rescheduling up to 24 hours before your appointment.
                                    Within 24 hours, a small fee may apply. Contact the clinic directly for last-minute changes.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Refund policy</h4>
                                <p className="text-sm text-gray-500">
                                    Full refund available if cancelled at least 48 hours before appointment.
                                    50% refund for cancellations made 24-48 hours in advance. No refunds within 24 hours.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Cancellation policy</h4>
                                <p className="text-sm text-gray-500">
                                    Cancel online or via app up to 24 hours before your appointment.
                                    Late cancellations may incur a fee. Please contact the clinic if you need to cancel on short notice.
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-4 mt-6 rounded-md flex items-center gap-4">
                            <BiError className="text-blue-600 text-2xl flex-shrink-0" />
                            <p className="text-blue-800 text-sm">
                                Please arrive 10 minutes early for your appointment.
                                Bring a valid ID and any relevant medical history information.
                            </p>
                        </div>
                    </Card>

                    {/* Terms and Conditions Checkbox Card */}
                    <Card className="p-6 rounded-lg shadow-md bg-white">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="w-5 h-5 border rounded"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-700">
                                    I agree to the <Link to="/terms" className="text-blue-600 underline">Terms and Conditions</Link> and understand the cancellation policy.
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    className="w-5 h-5 border rounded"
                                />
                                <label htmlFor="privacy" className="text-sm text-gray-700">
                                    I consent to my data being processed in accordance with the <Link to="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
                                </label>
                            </div>
                            <p className="text-sm text-gray-600">
                                By completing this booking, you confirm that you have read and agree to our terms.
                                Your personal information will be handled securely and in compliance with GDPR regulations.
                            </p>
                        </div>
                    </Card>


                </div >

                {/* Right Column: Treatment Summary Card */}
                <div className="md:col-span-1">
                    <Card className="p-4 md:p-8 rounded-xl shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 max-w-md mx-auto">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-lime-400 from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                                {selectedServices.length > 0 ? selectedServices[0].name.charAt(0).toUpperCase() : 'T'}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {selectedServices.length > 0 ? selectedServices[0].name : 'Treatment'}
                            </h2>
                            <p className="text-sm text-gray-600">{selectedClinic?.name || 'Premium Clinic'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 mb-6 border border-blue-200">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-xl font-bold text-blue-600">
                                    {selectedTimeSlot?.startTime || '17:00'}
                                </div>
                                <div className="border-l border-gray-300 h-8 mx-4"></div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-800">
                                        {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sat 13 Sep'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {selectedServices.length > 0 ? `${selectedServices[0].durationMinutes || 30} mins total` : '30 mins total'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mb-3">
                                <Link to={`/appointment/booking?clinicId=${selectedClinic.id}&serviceIds=${selectedServices[0].id}`} className="text-blue-600 hover:text-blue-700 underline text-sm font-medium">
                                    Choose a different time
                                </Link>
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                                With {selectedClinic?.name || 'first available practitioner'}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 mb-6 border border-blue-200">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Treatment Price</span>
                                    <span className="font-medium">€{selectedServices.length > 0 ? selectedServices[0].price || 120 : 120}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Beauty Points Discount</span>
                                    <span className="font-medium text-green-600">-€{(user?.beautyPoints || 0) / 10 || 0}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-3">
                                    <span className="text-gray-800">Total</span>
                                    <span className="text-blue-600">€{selectedServices.length > 0 ? (selectedServices[0].price || 120) - ((user?.beautyPoints || 0) / 10 || 0) : 120}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleCompleteBooking}
                            disabled={isSubmitting || isLoading}
                            className="w-full bg-lime-400 from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {isSubmitting || isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Complete Booking'}
                        </button>
                        {error && (
                            <div className="text-red-500 text-sm mt-2 text-center">
                                {error}
                            </div>
                        )}

                    </Card>
                </div >
            </div >
            <BookingNoteModal
                isOpen={isBookingNoteOpen}
                onClose={() => setBookingNoteOpen(false)}
                onSave={handleSaveNote}
            />
        </section >
    );
};
