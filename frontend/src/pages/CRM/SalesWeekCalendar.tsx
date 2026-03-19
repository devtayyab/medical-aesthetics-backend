import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ChevronLeft, ChevronRight, Plus, Clock, User, Scissors, CheckCircle2,
    XCircle, AlertCircle, Calendar, CreditCard, X, Search, MapPin
} from 'lucide-react';
import {
    format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameDay,
    startOfDay, isToday, addWeeks, subWeeks, subDays, setHours, setMinutes, parseISO
} from 'date-fns';
import { AppDispatch, RootState } from '@/store';
import {
    fetchClinicAppointments,
    updateAppointmentStatus,
    completeAppointment,
    setSelectedClinic,
    setSelectedDate,
    setSelectedTimeSlot,
    addService,
    clearBooking,
} from '@/store/slices/bookingSlice';
import { fetchAvailability } from '@/store/slices/clinicSlice';
import { fetchLeads, createLead } from '@/store/slices/crmSlice';
import { Button } from '@/components/atoms/Button/Button';
import { crmAPI, clinicsAPI, bookingAPI } from '@/services/api';

const statusLabels: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: 'Booked', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    arrived: { label: 'Arrived', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: User },
    in_progress: { label: 'Started', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Scissors },
    no_show: { label: 'No-show', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    completed: { label: 'Done', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 },
};

export const SalesWeekCalendar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { appointments } = useSelector((state: RootState) => state.booking);
    const { availability } = useSelector((state: RootState) => state.clinic);
    const { user } = useSelector((state: RootState) => state.auth);
    const { leads } = useSelector((state: RootState) => state.crm);

    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [selectedClinicId, setSelectedClinicId] = useState<string>('all');

    // Drawers state
    const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

    // Detailed Appointment logic
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [isPaymentPrompt, setIsPaymentPrompt] = useState(false);
    const [paymentAmt, setPaymentAmt] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');

    // Wizard State
    const [wizardStep, setWizardStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [wizardClient, setWizardClient] = useState<any>(null);
    const [wizardClinic, setWizardClinic] = useState<any>(null);
    const [availableClinics, setAvailableClinics] = useState<any[]>([]);
    const [wizardServices, setWizardServices] = useState<any[]>([]);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [wizardDate, setWizardDate] = useState(new Date());
    const [wizardTime, setWizardTime] = useState(format(new Date(), 'HH:mm'));

    // Walk-in state
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [walkInForm, setWalkInForm] = useState({ firstName: '', lastName: '', phone: '' });

    // Fetch Base Clinic on Load
    useEffect(() => {
        const init = async () => {
            try {
                const res = await crmAPI.getAccessibleClinics();
                if (res.data) {
                    setAvailableClinics(res.data);
                    if (res.data.length > 0 && selectedClinicId === 'all') {
                        // Keep 'all' for managers/admins, but maybe default to first clinic for others
                    }
                }
            } catch (e) {
                console.error("Failed loading clinic/services", e);
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        const filters: any = {};
        if (user?.role === 'salesperson') {
            filters.providerId = user.id;
        }
        if (selectedClinicId !== 'all') {
            filters.clinicId = selectedClinicId;
            dispatch(fetchAvailability(selectedClinicId));
        }
        dispatch(fetchClinicAppointments(filters));
    }, [dispatch, user, selectedClinicId, viewDate]);

    useEffect(() => {
        if (searchQuery.length > 2) {
            dispatch(fetchLeads({ search: searchQuery }));
        }
    }, [searchQuery, dispatch]);

    // Fetch Slots when Service/Date changes in Wizard Step 3
    useEffect(() => {
        if (wizardStep !== 3 || !wizardClinic || wizardServices.length === 0) return;

        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const res = await bookingAPI.getAvailability({
                    clinicId: wizardClinic.id,
                    serviceId: wizardServices[0].id,
                    date: format(wizardDate, 'yyyy-MM-dd')
                });
                setAvailableTimeSlots(res.data.slots || res.data || []);
            } catch (err) {
                console.error("Failed to fetch slots", err);
            } finally {
                setIsLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [wizardStep, wizardClinic, wizardServices, wizardDate]);

    const weekDays = useMemo(() => {
        if (viewMode === 'day') return [startOfDay(viewDate)];
        return eachDayOfInterval({
            start: startOfWeek(viewDate, { weekStartsOn: 1 }),
            end: endOfWeek(viewDate, { weekStartsOn: 1 })
        });
    }, [viewDate, viewMode]);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const handleOpenWizard = async (initialDate?: Date, initialTimeStr?: string) => {
        if (initialDate) setWizardDate(initialDate);
        if (initialTimeStr) setWizardTime(initialTimeStr);
        setWizardStep(1);
        setWizardClient(null);
        setWizardServices([]);
        setIsWalkIn(false);
        setWalkInForm({ firstName: '', lastName: '', phone: '' });

        // Default clinic to the selected one in the view if not 'all'
        if (selectedClinicId !== 'all') {
            const clinic = availableClinics.find(c => c.id === selectedClinicId);
            if (clinic) {
                setWizardClinic(clinic);
                try {
                    const srvRes = await clinicsAPI.getServices(clinic.id);
                    setAvailableServices(srvRes.data);
                } catch (err) {
                    console.error(err);
                }
            }
        } else if (availableClinics.length > 0) {
            setWizardClinic(availableClinics[0]);
            try {
                const srvRes = await clinicsAPI.getServices(availableClinics[0].id);
                setAvailableServices(srvRes.data);
            } catch (err) {
                console.error(err);
            }
        }

        setIsAddWizardOpen(true);
    };

    const handleSaveWizard = async () => {
        let clientId = wizardClient ? wizardClient.id : null;
        let clientData = wizardClient || {};

        if (isWalkIn) {
            // Create minor contact
            const leadRes = await dispatch(createLead({
                source: 'walk_in',
                firstName: walkInForm.firstName,
                lastName: walkInForm.lastName,
                phone: walkInForm.phone,
                email: `${walkInForm.firstName.toLowerCase()}${Math.random().toString(36).substr(2, 5)}@walkin.local`,
                status: 'new'
            })).unwrap();
            clientId = leadRes.id;
            clientData = leadRes;
        }

        if (!clientId || wizardServices.length === 0 || !wizardClinic) return;

        const [hh, mm] = wizardTime.split(':').map(Number);
        const startDateTime = setMinutes(setHours(startOfDay(wizardDate), hh), mm);

        const totalDuration = wizardServices.reduce((acc, s) => acc + (s.duration || 30), 0);
        const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);

        // Populate Booking State for Checkout
        dispatch(clearBooking());
        dispatch(setSelectedClinic(wizardClinic));
        dispatch(setSelectedDate(wizardDate.toISOString()));

        // Checkout expects a TimeSlot object
        dispatch(setSelectedTimeSlot({
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            providerId: user?.id,
            clinicId: wizardClinic.id,
            available: true
        }));

        // Add services
        wizardServices.forEach(srv => dispatch(addService(srv)));

        // Navigate to checkout with client info
        navigate('/checkout', {
            state: {
                customerId: clientId,
                customerName: `${clientData.firstName} ${clientData.lastName}`,
                customerEmail: clientData.email,
                customerPhone: clientData.phone,
                name: `${clientData.firstName} ${clientData.lastName}`, // Fallback
                email: clientData.email,
                phone: clientData.phone
            }
        });

        setIsAddWizardOpen(false);
    };

    const handleStatusUpdate = async (id: string, st: string) => {
        if (st === 'completed') {
            setIsPaymentPrompt(true);
            return;
        }
        await dispatch(updateAppointmentStatus({ id, status: st }));
        setSelectedApt({ ...selectedApt, status: st });
        dispatch(fetchClinicAppointments({ providerId: user?.id }));
    };

    const handleCompletePayment = async () => {
        if (!selectedApt) return;
        await dispatch(completeAppointment({
            id: selectedApt.id,
            completionData: {
                amountPaid: parseFloat(paymentAmt) || 0,
                paymentMethod,
                completedAt: new Date().toISOString()
            }
        }));
        setIsPaymentPrompt(false);
        setIsDetailDrawerOpen(false);
        dispatch(fetchClinicAppointments({ providerId: user?.id }));
    };

    const openAptDetails = (apt: any) => {
        setSelectedApt(apt);
        setIsPaymentPrompt(false);
        setPaymentAmt(apt.service?.price?.toString() || '');
        setIsDetailDrawerOpen(true);
    };

    return (
        <div className="flex h-[calc(100vh-200px)] min-h-[700px] w-full bg-gray-50 relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            {/* Main Calendar View */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ${isAddWizardOpen || isDetailDrawerOpen ? 'mr-96' : ''}`}>
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-10">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                Sales Schedule
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">24H UPDATED</span>
                            </h1>
                            <p className="text-xs font-bold text-gray-400">View & Manage your Appointments</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={selectedClinicId}
                            onChange={(e) => setSelectedClinicId(e.target.value)}
                            className="bg-gray-100 border border-gray-200 text-gray-900 rounded-lg px-4 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none pr-8 min-w-[180px]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                        >
                            <option value="all">🏥 All Clinics</option>
                            {availableClinics.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <div className="flex gap-1 items-center bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setViewMode('day')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Day</button>
                            <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Week</button>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(d => viewMode === 'week' ? subWeeks(d, 1) : subDays(d, 1))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-bold text-gray-700 min-w-[140px] text-center">
                                {viewMode === 'week'
                                    ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[weekDays.length - 1], 'MMM d')}`
                                    : format(viewDate, 'EEEE, MMM d')}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(d => viewMode === 'week' ? addWeeks(d, 1) : addDays(d, 1))}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" className="h-7 px-3 text-xs font-bold ml-1 hover:bg-white" onClick={() => setViewDate(new Date())}>Today</Button>
                        </div>

                        <Button onClick={() => handleOpenWizard()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100">
                            <Plus className="w-4 h-4" /> Add Appointment
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto flex bg-white relative">
                    <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 pt-12 sticky left-0 z-20">
                        {hours.map(hour => (
                            <div key={hour} className="h-16 flex items-start justify-center text-[10px] font-bold text-gray-400 -mt-2">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} min-w-[800px] relative`}>
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className={`relative border-r border-gray-100 ${isToday(day) ? 'bg-indigo-50/20' : ''}`}>
                                <div className="h-12 border-b border-gray-100 flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                                    <span className={`text-[10px] font-bold uppercase ${isToday(day) ? 'text-indigo-600' : 'text-gray-500'}`}>{format(day, 'EEE')}</span>
                                    <span className={`text-base font-black ${isToday(day) ? 'text-indigo-700' : 'text-gray-900'}`}>{format(day, 'd')}</span>
                                </div>
                                <div className="relative h-[1536px]"> {/* 24 * 64px = 1536px */}
                                    {hours.map(hour => {
                                        const dayName = format(day, 'EEEE').toLowerCase();
                                        const bh = availability?.businessHours?.[dayName];
                                        let isClosed = false;
                                        if (bh) {
                                            const [openH] = bh.open.split(':').map(Number);
                                            const [closeH] = bh.close.split(':').map(Number);
                                            if (!bh.isOpen || hour < openH || hour >= closeH) {
                                                isClosed = true;
                                            }
                                        }

                                        // Check if this hour is blocked
                                        const isBlocked = availability?.blockedSlots?.some(slot => {
                                            const slotDate = new Date(slot.date);
                                            if (!isSameDay(slotDate, day)) return false;
                                            const [bH] = slot.startTime.split(':').map(Number);
                                            return bH === hour;
                                        });

                                        return (
                                            <div
                                                key={hour}
                                                className={`h-16 border-b border-gray-50/50 w-full hover:bg-gray-50/50 cursor-pointer relative ${isClosed ? 'bg-gray-100/50 pattern-diagonal-lines' : ''} ${isBlocked ? 'bg-orange-50/30' : ''}`}
                                                onClick={() => handleOpenWizard(day, `${hour.toString().padStart(2, '0')}:00`)}
                                            >
                                                {isClosed && hour === 12 && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-gray-400 rotate-[-15deg] uppercase tracking-widest">Closed</span>
                                                    </div>
                                                )}
                                                {isBlocked && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[8px] font-bold text-orange-400/60 uppercase tracking-tighter">Blocked</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {appointments.filter(a => isSameDay(new Date(a.startTime), day)).map(apt => {
                                        const start = new Date(apt.startTime);
                                        const end = new Date(apt.endTime);
                                        const top = (start.getHours()) * 64 + (start.getMinutes() / 60) * 64;
                                        const height = Math.max(((end.getTime() - start.getTime()) / 3600000) * 64, 40);
                                        const style = statusLabels[apt.status] || statusLabels.pending;
                                        const Icon = style.icon;

                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={(e) => { e.stopPropagation(); openAptDetails(apt); }}
                                                className={`absolute left-1 right-1 rounded-md border p-2 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] z-20 ${style.color}`}
                                                style={{ top, height }}
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Icon className="w-3 h-3 opacity-80" />
                                                    <span className="text-[10px] font-black uppercase truncate">{apt.client?.firstName} {apt.client?.lastName}</span>
                                                </div>
                                                <div className="text-[9px] font-bold opacity-80 truncate">{apt.service?.name}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Appointment Creation Wizard Drawer */}
            {isAddWizardOpen && (
                <div className="fixed top-0 right-0 w-[400px] h-screen bg-white border-l border-gray-200 shadow-2xl flex flex-col z-[100] animate-in slide-in-from-right">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-lg font-black text-gray-900">New Appointment</h2>
                        <button onClick={() => setIsAddWizardOpen(false)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"><X size={20} /></button>
                    </div>

                    <div className="flex px-4 py-2 border-b border-gray-100 bg-white items-center text-xs font-bold text-gray-400 gap-1">
                        <span className={wizardStep >= 1 ? 'text-indigo-600' : ''}>1. Client</span>
                        <ChevronRight size={12} />
                        <span className={wizardStep >= 2 ? 'text-indigo-600' : ''}>2. Service</span>
                        <ChevronRight size={12} />
                        <span className={wizardStep >= 3 ? 'text-indigo-600' : ''}>3. Time</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {wizardStep === 1 && (
                            <div className="space-y-4">
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                    <button onClick={() => setIsWalkIn(false)} className={`flex-1 text-xs font-bold py-1.5 rounded ${!isWalkIn ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Search Lead</button>
                                    <button onClick={() => setIsWalkIn(true)} className={`flex-1 text-xs font-bold py-1.5 rounded ${isWalkIn ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Walk-in</button>
                                </div>

                                {!isWalkIn ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search name, phone, email..."
                                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            {leads.map(lead => (
                                                <div
                                                    key={lead.id}
                                                    onClick={() => setWizardClient(lead)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${wizardClient?.id === lead.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                                                >
                                                    <p className="font-bold text-gray-900 text-sm">{lead.firstName} {lead.lastName}</p>
                                                    <p className="text-xs text-gray-500">{lead.email} • {lead.phone}</p>
                                                </div>
                                            ))}
                                            {leads.length === 0 && <p className="text-xs text-center text-gray-400 p-4">Search above to find contacts.</p>}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <input type="text" placeholder="First Name" value={walkInForm.firstName} onChange={(e) => setWalkInForm({ ...walkInForm, firstName: e.target.value })} className="w-full p-2 border border-gray-200 rounded text-sm" />
                                        <input type="text" placeholder="Last Name" value={walkInForm.lastName} onChange={(e) => setWalkInForm({ ...walkInForm, lastName: e.target.value })} className="w-full p-2 border border-gray-200 rounded text-sm" />
                                        <input type="text" placeholder="Phone Number" value={walkInForm.phone} onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })} className="w-full p-2 border border-gray-200 rounded text-sm" />
                                    </div>
                                )}
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Select Clinic</label>
                                    <select
                                        className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white font-medium"
                                        value={wizardClinic?.id || ''}
                                        onChange={async (e) => {
                                            const val = e.target.value;
                                            const clinic = availableClinics.find(c => c.id === val);
                                            setWizardClinic(clinic);
                                            setWizardServices([]);
                                            if (clinic) {
                                                try {
                                                    const srvRes = await clinicsAPI.getServices(clinic.id);
                                                    setAvailableServices(srvRes.data);
                                                } catch (err) {
                                                    console.error(err);
                                                    setAvailableServices([]);
                                                }
                                            } else {
                                                setAvailableServices([]);
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose a clinic --</option>
                                        {availableClinics.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Available Services</p>
                                    {availableServices.length === 0 && wizardClinic && (
                                        <p className="text-xs text-center text-gray-400 p-4">No services configured for this clinic.</p>
                                    )}
                                    {availableServices.map(srv => {
                                        const isSelected = wizardServices.find(s => s.id === srv.id);
                                        return (
                                            <div
                                                key={srv.id}
                                                onClick={() => {
                                                    if (isSelected) setWizardServices(ws => ws.filter(x => x.id !== srv.id));
                                                    else setWizardServices([...wizardServices, srv]);
                                                }}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{srv.name}</p>
                                                    <p className="text-xs text-gray-500">{srv.duration} mins • €{srv.price}</p>
                                                </div>
                                                {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {wizardStep === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Selected Date</label>
                                    <input type="date" value={format(wizardDate, 'yyyy-MM-dd')} onChange={(e) => setWizardDate(parseISO(e.target.value))} className="w-full p-2 mt-1 border border-gray-200 rounded text-sm bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                        <span>Start Time</span>
                                        {isLoadingSlots && <span className="text-indigo-500">Loading slots...</span>}
                                    </label>

                                    {!isLoadingSlots && availableTimeSlots.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            {availableTimeSlots.map((slot: any, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setWizardTime(format(new Date(slot.startTime), 'HH:mm'))}
                                                    className={`p-2 text-center text-xs font-bold rounded-lg border cursor-pointer transition-colors ${wizardTime === format(new Date(slot.startTime), 'HH:mm')
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 hover:border-indigo-300 text-gray-700 bg-white'
                                                        }`}
                                                >
                                                    {format(new Date(slot.startTime), 'hh:mm a')}
                                                </div>
                                            ))}
                                            <div className="col-span-3 mt-2">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Custom Time Override</p>
                                                <input type="time" value={wizardTime} onChange={(e) => setWizardTime(e.target.value)} className="w-full p-2 border border-gray-200 rounded text-sm bg-gray-50 focus:bg-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <input type="time" value={wizardTime} onChange={(e) => setWizardTime(e.target.value)} className="w-full p-2 mt-1 border border-gray-200 rounded text-sm bg-gray-50" />
                                    )}
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg mt-4 border border-indigo-100">
                                    <h4 className="font-black text-indigo-900 mb-2 border-b border-indigo-100 pb-2">Summary</h4>
                                    <p className="text-sm font-medium text-indigo-800 flex justify-between"><span>Client:</span> <span className="font-bold">{isWalkIn ? walkInForm.firstName : wizardClient?.firstName}</span></p>
                                    <p className="text-sm font-medium text-indigo-800 flex justify-between mt-1"><span>Services:</span> <span className="font-bold">{wizardServices.length} selected</span></p>
                                    <p className="text-sm font-medium text-indigo-800 flex justify-between mt-1"><span>Total Cost:</span> <span className="font-bold border-t border-indigo-100 pt-1 mt-1 block">€{wizardServices.reduce((a, b) => a + parseFloat(b.price || '0'), 0).toFixed(2)}</span></p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                        {wizardStep > 1 && (
                            <Button variant="outline" className="flex-1 bg-white" onClick={() => setWizardStep(s => s - 1)}>Back</Button>
                        )}
                        {wizardStep < 3 ? (
                            <Button onClick={() => setWizardStep(s => s + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={wizardStep === 1 && !wizardClient && !isWalkIn}>Next</Button>
                        ) : (
                            <Button onClick={handleSaveWizard} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Book Visit</Button>
                        )}
                    </div>
                </div>
            )}

            {/* Appointment Detail Drawer */}
            {isDetailDrawerOpen && selectedApt && (
                <div className="fixed top-0 right-0 w-[400px] h-screen bg-white border-l border-gray-200 shadow-2xl flex flex-col z-[100] animate-in slide-in-from-right">
                    <div className={`p-6 text-white ${statusLabels[selectedApt.status]?.color?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-800'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-black text-white">{selectedApt.client?.firstName} {selectedApt.client?.lastName}</h2>
                            <button onClick={() => setIsDetailDrawerOpen(false)} className="text-white/70 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                            <Clock size={14} /> {format(new Date(selectedApt.startTime), 'EEEE, MMM do, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/90 mt-1">
                            <MapPin size={14} /> {format(new Date(selectedApt.startTime), 'HH:mm')} - {format(new Date(selectedApt.endTime), 'HH:mm')}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Service Details</p>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{selectedApt.service?.name}</p>
                                    <p className="text-xs text-gray-500">{selectedApt.service?.duration} mins</p>
                                </div>
                                <span className="text-lg font-black text-gray-900">€{selectedApt.service?.price}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Status</p>
                            <select
                                value={selectedApt.status}
                                onChange={(e) => handleStatusUpdate(selectedApt.id, e.target.value)}
                                disabled={selectedApt.status === 'completed'}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-indigo-500"
                            >
                                <option value="pending">Booked</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="arrived">Arrived</option>
                                <option value="in_progress">Started</option>
                                <option value="no_show">No Show</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Done (Completed)</option>
                            </select>
                        </div>

                        {isPaymentPrompt && (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <CreditCard size={18} /> <h3 className="font-black">Capture Payment</h3>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-emerald-600 uppercase">Amount Received (€)</label>
                                    <input type="number" value={paymentAmt} onChange={e => setPaymentAmt(e.target.value)} className="w-full mt-1 p-2 border border-emerald-200 rounded text-emerald-900 font-bold" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-200'}`}>CASH</button>
                                    <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'card' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-200'}`}>CARD</button>
                                </div>
                                <Button onClick={handleCompletePayment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black">Confirm & Generate Revenue</Button>
                            </div>
                        )}

                        {selectedApt.status === 'completed' && !isPaymentPrompt && (
                            <div className="bg-gray-100 p-4 rounded-xl text-center">
                                <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-gray-600">This appointment is locked and payment is secured.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
