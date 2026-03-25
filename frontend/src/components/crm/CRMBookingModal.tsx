import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { RootState } from '@/store';
import { format } from 'date-fns';

import { clinicsAPI, bookingAPI } from '@/services/api';

interface CRMBookingModalProps {
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customer?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
    };
    taskId?: string;
    onTaskComplete?: (taskId: string) => void;
    isOpen?: boolean;
    bookedBy?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CRMBookingModal: React.FC<CRMBookingModalProps> = ({
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    customer,
    taskId,
    onTaskComplete,
    isOpen,
    bookedBy,
    onClose,
    onSuccess
}) => {
    const finalCustomerId = customer?.id || customerId || '';
    const finalCustomerName = customer?.name || customerName || '';
    const finalCustomerEmail = customer?.email || customerEmail || '';
    const finalCustomerPhone = customer?.phone || customerPhone || '';

    if (isOpen === false) return null;
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

    // Fetch Slots when service/date changes
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
                setSlots(res.data.timeSlots || []);
            } catch (err) {
                console.error("Failed to fetch slots", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSlots();
        setSelectedSlot(null);
    }, [selectedClinic, selectedService, selectedDate]);

    const handleConfirmBooking = async () => {
        if (!selectedClinic || !selectedService || !selectedSlot) return;
        setIsLoading(true);
        try {
            const startDateTime = new Date(`${selectedDate}T${selectedSlot.startTime}`);
            const endDateTime = new Date(`${selectedDate}T${selectedSlot.endTime}`);

            await bookingAPI.createAppointment({
                clientId: finalCustomerId,
                clinicId: selectedClinic,
                serviceId: selectedService,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                notes,
                bookedById: bookedBy || user?.id,
                status: 'CONFIRMED',
                clientDetails: {
                    fullName: finalCustomerName,
                    email: finalCustomerEmail,
                    phone: finalCustomerPhone
                }
            });

            if (taskId && onTaskComplete) {
                await onTaskComplete(taskId);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Booking failed", err);
            alert("Failed to book appointment. Slot might be taken.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="text-sm font-bold text-slate-500 mb-2">Select a Clinic Location</div>
                        <div className="grid grid-cols-1 gap-2">
                            {clinics.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setSelectedClinic(c.id); setStep(2); }}
                                    className={`p-4 text-left border rounded-xl transition-all ${selectedClinic === c.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{c.name}</div>
                                        <MapPin className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 font-medium">{c.address.street}, {c.address.city}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-8 w-8 p-0 rounded-full">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-black text-slate-800">Choose Service</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {services.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSelectedService(s.id); setStep(3); }}
                                    className={`p-4 text-left border rounded-xl transition-all ${selectedService === s.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{s.name}</div>
                                        <div className="text-blue-600 font-black text-xs">€{s.price}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 font-medium">{s.durationMinutes} minutes duration</div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-8 w-8 p-0 rounded-full">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-black text-slate-800">Select Date & Time</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Available Date</label>
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Choose Slot</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {slots.length === 0 ? (
                                        <div className="col-span-3 py-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No slots available for this date</div>
                                    ) : (
                                        slots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-2.5 text-center text-[11px] font-black border rounded-lg transition-all ${selectedSlot === slot ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'}`}
                                            >
                                                {slot.startTime}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="h-8 w-8 p-0 rounded-full">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-black text-slate-800">Verify Final Details</span>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Client</span>
                                    <span className="text-sm font-black text-slate-900">{finalCustomerName}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Treatment</span>
                                    <span className="text-[11px] font-black text-slate-800">{services.find(s => s.id === selectedService)?.name}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Location</span>
                                    <span className="text-[11px] font-black text-slate-800">{clinics.find(c => c.id === selectedClinic)?.name}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Reservation</span>
                                    <span className="text-[11px] font-black text-slate-800">{new Date(selectedDate).toLocaleDateString()} at {selectedSlot?.startTime}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Internal ID</span>
                                    <span className="text-[11px] font-black text-blue-600">APP-NEW-{Math.random().toString(36).substr(2, 4).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Special Coordination Notes</label>
                            <textarea 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add specific requirements or prep instructions..."
                                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white transition-all shadow-inner"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4 md:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 pointer-events-auto overflow-hidden border border-slate-100 flex flex-col h-full max-h-[85vh]">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Clinical Scheduler</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Booking Interface v2.4</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 rounded-2xl bg-slate-50 hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4">
                    {/* Stepper Wizard */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400'}`}>
                                    {s}
                                </div>
                                {s < 4 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-blue-200' : 'bg-slate-100'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[300px]">
                        {renderStepContent()}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Protocol</span>
                        <span className="text-[10px] font-black text-emerald-500">Encrypted Transmission</span>
                    </div>
                    {step < 4 ? (
                        <Button 
                            disabled={step === 1 && !selectedClinic || step === 2 && !selectedService || step === 3 && !selectedSlot}
                            onClick={() => setStep(step + 1)} 
                            className="h-12 px-8 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleConfirmBooking} 
                            disabled={isLoading}
                            className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                        >
                            {isLoading ? 'Processing...' : 'Complete Booking'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
