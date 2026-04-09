import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, MapPin, ChevronRight, ChevronLeft, Search, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { RootState } from '@/store';
import { format } from 'date-fns';

import { clinicsAPI, bookingAPI, crmAPI } from '@/services/api';

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
    clinicId?: string;
    onClose: () => void;
    onSuccess?: () => void;
    initialAppointment?: any;
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
    clinicId,
    onClose,
    onSuccess,
    initialAppointment
}) => {
    // Determine initial client state
    const propCustomerId = customer?.id || customerId || '';
    const propCustomerName = customer?.name || customerName || '';
    const propCustomerEmail = customer?.email || customerEmail || '';
    const propCustomerPhone = customer?.phone || customerPhone || '';

    const { user } = useSelector((state: RootState) => state.auth);
    
    // Internal state for selected client (if selection happens in Step 0)
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState<any[]>([]);

    // Steps: 0=Select Client, 1=Clinic, 2=Service, 3=Date/Time, 4=Confirm
    const [step, setStep] = useState(propCustomerId ? 1 : 0);
    const [isLoading, setIsLoading] = useState(false);

    // Data
    const [clinics, setClinics] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);

    // Selection
    const [selectedClinic, setSelectedClinic] = useState<string>(initialAppointment?.clinicId || clinicId || '');
    const [selectedService, setSelectedService] = useState<string>(initialAppointment?.serviceId || '');
    const [selectedDate, setSelectedDate] = useState<string>(
        initialAppointment?.startTime 
            ? format(new Date(initialAppointment.startTime), 'yyyy-MM-dd') 
            : format(new Date(), 'yyyy-MM-dd')
    );
    const [selectedSlot, setSelectedSlot] = useState<any>(
        initialAppointment ? {
            startTime: format(new Date(initialAppointment.startTime), 'HH:mm'),
            endTime: format(new Date(initialAppointment.endTime || initialAppointment.startTime), 'HH:mm'),
        } : null
    );
    const [notes, setNotes] = useState(initialAppointment?.notes || '');

    useEffect(() => {
        if (initialAppointment && isOpen) {
            setSelectedClinic(initialAppointment.clinicId);
            setSelectedService(initialAppointment.serviceId);
            setSelectedDate(format(new Date(initialAppointment.startTime), 'yyyy-MM-dd'));
            setSelectedSlot({
                startTime: format(new Date(initialAppointment.startTime), 'HH:mm'),
                endTime: format(new Date(initialAppointment.endTime || initialAppointment.startTime), 'HH:mm'),
                // We don't have the full slot object but startTime/endTime are enough for the API
            });
            setNotes(initialAppointment.notes || '');
            setStep(1); // Start at clinic selection or skip if already selected? 
            // Better to let them navigate.
        }
    }, [initialAppointment, isOpen]);

    // Derived client data
    const finalCustomerId = selectedClient?.id || propCustomerId;
    const finalCustomerName = selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : propCustomerName;
    const finalCustomerEmail = selectedClient?.email || propCustomerEmail;
    const finalCustomerPhone = selectedClient?.phone || propCustomerPhone;

    // Search Clients logic
    useEffect(() => {
        if (!isOpen || step !== 0 || !clientSearch || clientSearch.length < 2) {
            setClientResults([]);
            return;
        }
        
        const searchTimer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await crmAPI.getLeads({ search: clientSearch });
                setClientResults(res.data || []);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(searchTimer);
    }, [clientSearch, step, isOpen]);

    // Fetch Clinics on mount
    useEffect(() => {
        if (!isOpen) return;
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
    }, [isOpen]);

    // Fetch Services when clinic changes
    useEffect(() => {
        if (!isOpen || !selectedClinic) return;
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
    }, [selectedClinic, isOpen]);

    // Fetch Slots when service/date changes
    useEffect(() => {
        if (!isOpen || !selectedClinic || !selectedService || !selectedDate) return;
        const fetchSlots = async () => {
            setIsLoading(true);
            try {
                const res = await bookingAPI.getAvailability({
                    clinicId: selectedClinic,
                    serviceId: selectedService,
                    date: selectedDate
                });
                setSlots(res.data.slots || []);
            } catch (err) {
                console.error("Failed to fetch slots", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSlots();
        setSelectedSlot(null);
    }, [selectedClinic, selectedService, selectedDate, isOpen]);

    if (!isOpen) return null;

    const handleConfirmBooking = async () => {
        if (!selectedClinic || !selectedService || !selectedSlot || !finalCustomerId) return;
        
        const bookedByIdUUID = user?.id;
        setIsLoading(true);
        try {
            const bookingPayload: any = {
                clientId: finalCustomerId,
                clinicId: selectedClinic,
                serviceId: selectedService,
                startTime: selectedSlot.startTime.includes('T') ? selectedSlot.startTime : `${selectedDate}T${selectedSlot.startTime}:00Z`,
                endTime: selectedSlot.endTime.includes('T') ? selectedSlot.endTime : `${selectedDate}T${selectedSlot.endTime}:00Z`,
                notes,
                status: initialAppointment?.status || 'CONFIRMED',
                clientDetails: {
                    fullName: finalCustomerName || 'Unknown',
                    email: finalCustomerEmail || `noemail@placeholder.com`,
                    phone: finalCustomerPhone || '0000000000'
                }
            };
            
            if (bookedByIdUUID) {
                bookingPayload.bookedById = bookedByIdUUID;
            }

            if (initialAppointment?.id) {
                // UPDATE branch
                await bookingAPI.updateAppointment(initialAppointment.id, {
                    clinicId: selectedClinic,
                    serviceId: selectedService,
                    startTime: bookingPayload.startTime,
                    endTime: bookingPayload.endTime,
                    notes: bookingPayload.notes
                });
            } else {
                // CREATE branch
                await bookingAPI.createAppointment(bookingPayload);
            }

            if (taskId && onTaskComplete) {
                await onTaskComplete(taskId);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Booking failed", err);
            alert("Failed to process appointment. Slot might be taken or invalid.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div className="text-sm font-bold text-slate-500 mb-2">Search & Select a Client</div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                placeholder="Search by name, email or phone..."
                                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                            {clientResults.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setStep(1);
                                    }}
                                    className="w-full p-4 flex items-center gap-4 text-left border border-slate-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-slate-800">{client.firstName} {client.lastName}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{client.email} | {client.phone || 'No phone'}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </button>
                            ))}
                            {clientSearch.length >= 2 && clientResults.length === 0 && !isLoading && (
                                <div className="text-center py-6 text-slate-400 text-xs font-bold">No clients found matching "{clientSearch}"</div>
                            )}
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            {!propCustomerId && (
                                <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="h-8 w-8 p-0 rounded-full">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            )}
                            <div className="text-sm font-bold text-slate-500">Select a Clinic Location</div>
                        </div>
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
                                        <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{s.name?.trim() || (s.treatment?.name)}</div>
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
                                                {slot.startTimeDisplay || slot.startTime.split('T')[1].substring(0, 5)}
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
                                    <span className="text-[11px] font-black text-slate-800">
                                        {services.find(s => s.id === selectedService)?.name || services.find(s => s.id === selectedService)?.treatment?.name || 'Treatment'}
                                    </span>
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
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Booking Interface v2.5</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 rounded-2xl bg-slate-50 hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4">
                    {/* Stepper Wizard */}
                    <div className="flex items-center justify-between mb-8 px-2">
                        {[0, 1, 2, 3, 4].map(s => {
                            // Only show step 0 if we started from 0
                            if (s === 0 && propCustomerId) return null;
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400'}`}>
                                        {s}
                                    </div>
                                    {s < 4 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-blue-200' : 'bg-slate-100'}`} />}
                                </div>
                            );
                        })}
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
                    <div className="flex items-center gap-3">
                        {(step > 0 && !(step === 1 && propCustomerId)) && (
                            <Button 
                                variant="ghost"
                                onClick={() => setStep(step - 1)} 
                                className="h-12 px-6 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                            </Button>
                        )}
                        {step < 4 ? (
                            <Button 
                                disabled={
                                    step === 0 && !selectedClient ||
                                    step === 1 && !selectedClinic || 
                                    step === 2 && !selectedService || 
                                    step === 3 && !selectedSlot ||
                                    isLoading
                                }
                                onClick={() => setStep(step + 1)} 
                                className="h-12 px-8 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {isLoading ? 'Searching...' : 'Next Step'} <ChevronRight className="w-4 h-4 ml-2" />
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
        </div>
    );
};
