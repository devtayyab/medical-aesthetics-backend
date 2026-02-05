import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Calendar, Clock, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Input } from '@/components/atoms/Input/Input';
import { clinicsAPI, bookingAPI } from '@/services/api';
import { createAppointment } from '@/store/slices/bookingSlice';
import { AppDispatch, RootState } from '@/store';
import { format } from 'date-fns';

interface CRMBookingModalProps {
    customerId: string;
    customerName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CRMBookingModal: React.FC<CRMBookingModalProps> = ({
    customerId,
    customerName,
    onClose,
    onSuccess
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    // Steps: 1=Clinic, 2=Service, 3=Date/Time, 4=Confirm
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Data
    const [clinics, setClinics] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);

    // Selection
    const [selectedClinic, setSelectedClinic] = useState<string>('');
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [notes, setNotes] = useState('');

    // Fetch Clinics on mount
    useEffect(() => {
        const fetchClinics = async () => {
            setIsLoading(true);
            try {
                const res = await clinicsAPI.search({ limit: 100 });
                setClinics(res.data.clinics || []);
            } catch (err) {
                console.error("Failed to fetch clinics", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClinics();
    }, []);

    // Fetch Services when clinic changes
    useEffect(() => {
        if (!selectedClinic) return;
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const res = await clinicsAPI.getServices(selectedClinic);
                setServices(res.data || []);
            } catch (err) {
                console.error("Failed to fetch services", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
        setSelectedService('');
        setSelectedSlot(null);
    }, [selectedClinic]);

    // Fetch Slots when Service/Date changes
    useEffect(() => {
        if (!selectedClinic || !selectedService || !selectedDate) return;
        const fetchSlots = async () => {
            setIsLoading(true);
            try {
                const res = await bookingAPI.getAvailability({
                    clinicId: selectedClinic,
                    serviceId: selectedService,
                    date: selectedDate
                });
                setSlots(res.data.slots || res.data || []);
            } catch (err) {
                console.error("Failed to fetch slots", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSlots();
    }, [selectedClinic, selectedService, selectedDate]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        if (!selectedClinic || !selectedService || !selectedSlot) return;

        setIsLoading(true);
        try {
            // Construct payload dynamically to avoid sending undefined values
            const payload: any = {
                clinicId: selectedClinic,
                serviceId: selectedService,
                clientId: customerId,
                // Fix: Check if startTime is already a full ISO string to prevent double date (e.g. 2026-02-06T2026-02-06...)
                startTime: selectedSlot.startTime.includes('T')
                    ? selectedSlot.startTime
                    : `${selectedDate}T${selectedSlot.startTime}${selectedSlot.startTime.length === 5 ? ':00' : ''}`,

                endTime: selectedSlot.endTime.includes('T')
                    ? selectedSlot.endTime
                    : `${selectedDate}T${selectedSlot.endTime}${selectedSlot.endTime.length === 5 ? ':00' : ''}`,

                notes: notes || undefined,
                paymentMethod: 'pay_at_clinic',
            };

            // Only add providerId if explicitly selected/available
            if (selectedSlot.providerId) {
                payload.providerId = selectedSlot.providerId;
            }

            console.log("SENDING BOOKING PAYLOAD:", payload); // Debug log

            await dispatch(createAppointment(payload)).unwrap();

            alert('Appointment created successfully!');
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("Booking failed", err);
            // Log full detailed error for debugging
            console.log("Error details:", err.response?.data);

            const errorMessage = err.response?.data?.message
                ? (Array.isArray(err.response.data.message)
                    ? err.response.data.message.join(', ')
                    : err.response.data.message)
                : JSON.stringify(err.response?.data || 'Unknown error');

            alert(`Booking failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to format time slots
    const formatTime = (timeStr: string) => {
        try {
            // Check if it's an ISO string or just HH:mm
            if (timeStr.includes('T')) {
                return format(new Date(timeStr), 'hh:mm aa');
            }
            // Assume HH:mm
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return format(date, 'hh:mm aa');
        } catch (e) {
            return timeStr;
        }
    };

    const currentClinic = clinics.find(c => c.id === selectedClinic);
    const currentService = services.find(s => s.id === selectedService);

    const steps = [
        { id: 1, name: 'Clinic', icon: MapPin },
        { id: 2, name: 'Service', icon: ChevronRight },
        { id: 3, name: 'Time', icon: Clock },
        { id: 4, name: 'Confirm', icon: Calendar },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white shadow-2xl rounded-2xl border-none overflow-hidden">
                <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Book Appointment</CardTitle>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Client: {customerName}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>

                <CardContent className="p-0 flex-1 overflow-y-auto">
                    {/* Progress Steps Indicator */}
                    <div className="px-8 pt-6 pb-2">
                        <div className="relative flex justify-between items-center w-full">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                            {steps.map((s) => (
                                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step === s.id ? 'bg-green-600 text-white shadow-lg ring-4 ring-green-100' :
                                        step > s.id ? 'bg-green-100 text-green-600' : 'bg-white border text-gray-400'
                                        }`}>
                                        {step > s.id ? <ChevronRight className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-xs font-bold transition-colors ${step >= s.id ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {s.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Step 1: Clinic */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">Choose a Clinic</h3>
                                    <span className="text-xs text-gray-400 font-medium">Step 1 of 4</span>
                                </div>
                                {isLoading ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500">Discovering nearby clinics...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {clinics.map(clinic => (
                                            <div
                                                key={clinic.id}
                                                onClick={() => setSelectedClinic(clinic.id)}
                                                className={`group p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedClinic === clinic.id
                                                    ? 'border-green-600 bg-green-50 shadow-md'
                                                    : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{clinic.name}</div>
                                                    {selectedClinic === clinic.id && <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center"><ChevronRight className="w-3 h-3 text-white" /></div>}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="line-clamp-1">
                                                        {clinic.address ? `${clinic.address.street || ''}, ${clinic.address.city || ''}` : 'Address not specified'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {clinics.length === 0 && (
                                            <div className="col-span-2 py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-gray-400">No clinics found in your area.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Service */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">Select Treatment</h3>
                                    <span className="text-xs text-gray-400 font-medium">Step 2 of 4</span>
                                </div>
                                {isLoading ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500">Loading catalog...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {services.map(service => (
                                            <div
                                                key={service.id}
                                                onClick={() => setSelectedService(service.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${selectedService === service.id
                                                    ? 'border-green-600 bg-green-50 shadow-sm'
                                                    : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedService === service.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{service.name}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                            <Clock className="w-3 h-3" />
                                                            {service.durationMinutes} mins
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-green-700">€{service.price}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {services.length === 0 && <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl">No services available for this clinic.</div>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Date & Time */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">Pick a Schedule</h3>
                                    <span className="text-xs text-gray-400 font-medium">Step 3 of 4</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-5 space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Appointment Date</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 group-hover:scale-110 transition-transform">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                min={format(new Date(), 'yyyy-MM-dd')}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-green-600 focus:bg-white transition-all font-medium text-gray-800"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium px-1 italic">Click the calendar icon to select a specific date.</p>
                                    </div>
                                    <div className="md:col-span-7 space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Available Slots</label>
                                        {isLoading ? (
                                            <div className="py-10 flex flex-col items-center justify-center gap-3">
                                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-xs text-gray-400 italic">Checking for free time...</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                                {slots.map((slot, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`py-3 px-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedSlot === slot
                                                            ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-[1.02]'
                                                            : 'bg-white border-gray-100 text-gray-600 hover:border-green-200 hover:bg-green-50/30'
                                                            }`}
                                                    >
                                                        {formatTime(slot.startTime)}
                                                    </button>
                                                ))}
                                                {slots.length === 0 && (
                                                    <div className="col-span-3 py-10 text-center bg-gray-50 rounded-xl border border-dashed">
                                                        <p className="text-sm text-gray-400 font-medium">Fully booked on this day.</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">Try another date for more options.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Confirm */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-end mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">One Last Look</h3>
                                    <span className="text-xs text-green-600 font-bold tracking-widest flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                                        READY TO BOOK
                                    </span>
                                </div>

                                <div className="relative overflow-hidden bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
                                    <div className="absolute top-0 right-0 p-3">
                                        <div className="text-[10px] text-gray-300 font-black tracking-widest transform rotate-45 translate-x-4 -translate-y-2 opacity-50">CONFIRMATION</div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4 text-sm">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Treating</p>
                                                    <p className="font-bold text-gray-900 text-lg leading-tight">{customerName}</p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1 bg-gray-100 rounded text-gray-500"><MapPin className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Clinic Location</p>
                                                        <p className="font-bold text-gray-800">{currentClinic?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1 bg-gray-100 rounded text-gray-500"><ChevronRight className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Treatment Service</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-800">{currentService?.name}</p>
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black">{currentService?.durationMinutes}M</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1 bg-white rounded text-green-600 shadow-sm"><Calendar className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 leading-none">Date Scheduled</p>
                                                        <p className="font-bold text-gray-800 text-base">{format(new Date(selectedDate), 'EEEE, MMM dd, yyyy')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-1 bg-white rounded text-green-600 shadow-sm"><Clock className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 leading-none">Time Slot</p>
                                                        <p className="font-bold text-gray-800 text-base">{formatTime(selectedSlot?.startTime)}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Price</span>
                                                    <span className="text-2xl font-black text-green-700 leading-none">€{currentService?.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Internal Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any specific requirements or notes for the specialist..."
                                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-green-600 focus:bg-white transition-all text-sm min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardContent className="p-6 border-t bg-gray-50/30">
                    <div className="flex justify-between items-center max-w-lg mx-auto w-full">
                        {step > 1 ? (
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="group flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Go Back
                            </Button>
                        ) : <div />}

                        {step < 4 ? (
                            <Button
                                onClick={handleNext}
                                disabled={(step === 1 && !selectedClinic) || (step === 2 && !selectedService) || (step === 3 && !selectedSlot)}
                                className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 rounded-2xl shadow-lg hover:shadow-green-200 transition-all font-black text-base flex gap-2 group"
                            >
                                Continue Posting
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="bg-green-700 hover:bg-green-800 text-white px-12 py-6 rounded-2xl shadow-lg hover:shadow-green-200 transition-all font-black text-base animate-bounce-short"
                            >
                                {isLoading ? 'Processing...' : 'Complete Booking'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

