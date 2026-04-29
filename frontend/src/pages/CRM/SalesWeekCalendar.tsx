import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ChevronLeft, ChevronRight, Plus, Clock, User, Users, Scissors, CheckCircle2,
    XCircle, AlertCircle, Calendar, CreditCard, X, Search, MapPin, Phone, ArrowLeft
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
    PENDING: { label: 'Booked', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    ARRIVED: { label: 'Arrived', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: User },
    IN_PROGRESS: { label: 'Started', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Scissors },
    NO_SHOW: { label: 'No-show', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    COMPLETED: { label: 'Done', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 },
};

export const SalesWeekCalendar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { appointments } = useSelector((state: RootState) => state.booking);
    const { availability } = useSelector((state: RootState) => state.clinic);
    const { user } = useSelector((state: RootState) => state.auth);
    const { leads, salespersons } = useSelector((state: RootState) => state.crm);

    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
    const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'SUPER_ADMIN';
    const [selectedProviderId, setSelectedProviderId] = useState<string>(user?.id || 'all');

    // Drawers state
    const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

    // Detailed Appointment logic
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [isPaymentPrompt, setIsPaymentPrompt] = useState(false);
    const [paymentAmt, setPaymentAmt] = useState('');

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        visible: boolean;
        date: Date;
        time: string;
    } | null>(null);
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
    const [wizardProviderId, setWizardProviderId] = useState<string | null>(null);
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const [clinicSearchQuery, setClinicSearchQuery] = useState('');
    const [isClinicDropdownOpen, setIsClinicDropdownOpen] = useState(false);

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

    const currentFilters = useMemo(() => {
        const filters: any = {};
        if (!isManager && user?.role !== 'salesperson') {
            filters.providerId = user?.id;
        } else if (isManager && selectedProviderId !== 'all') {
            filters.providerId = selectedProviderId;
        }
        if (viewMode === 'week') {
            filters.startDate = format(startOfWeek(viewDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            filters.endDate = format(endOfWeek(viewDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else {
            filters.date = format(viewDate, 'yyyy-MM-dd');
        }
        if (selectedClinicId !== 'all') {
            filters.clinicId = selectedClinicId;
        }
        return filters;
    }, [user, selectedClinicId, selectedProviderId, viewDate, viewMode, isManager]);

    useEffect(() => {
        if (selectedClinicId !== 'all') {
            dispatch(fetchAvailability({
                clinicId: selectedClinicId,
                date: format(viewDate, 'yyyy-MM-dd'),
                serviceId: 'all'
            } as any));
        }
        console.log('[SalesWeekCalendar] Fetching appointments with currentFilters:', currentFilters);
        dispatch(fetchClinicAppointments(currentFilters));
    }, [dispatch, currentFilters]);

    useEffect(() => {
        if (searchQuery.length > 2) {
            dispatch(fetchLeads({ search: searchQuery }));
        }
    }, [searchQuery, dispatch]);

    // Fetch Slots when Service/Date changes in Wizard Step 2
    useEffect(() => {
        if (wizardStep !== 2 || !wizardClinic || wizardServices.length === 0) return;

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

    const weeklyStats = useMemo(() => {
        const stats = {
            booked: 0,
            done: 0,
            noShow: 0,
            cancelled: 0,
            returned: 0
        };

        console.log(`[SalesWeekCalendar] Calculating stats for ${appointments.length} appointments`);

        appointments.forEach(apt => {
            const aptDate = new Date(apt.startTime);
            let isInView = false;
            if (viewMode === 'week') {
                const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });
                if (aptDate >= weekStart && aptDate <= weekEnd) isInView = true;
            } else {
                if (isSameDay(aptDate, viewDate)) isInView = true;
            }

            if (isInView) {
                stats.booked++;
                if (apt.status === 'COMPLETED' || apt.status === 'EXECUTED') stats.done++;
                if (apt.status === 'NO_SHOW') stats.noShow++;
                if (apt.status === 'CANCELLED') stats.cancelled++;
                if ((apt as any).isReturned) stats.returned++;
            }
        });

        return stats;
    }, [appointments, viewDate, viewMode]);

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

    const handleCreateBooking = async () => {
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

        try {
            await bookingAPI.createAppointment({
                clientId: clientId!,
                clinicId: wizardClinic.id,
                serviceId: wizardServices[0].id, // For v1, handle principal service
                providerId: wizardProviderId || user?.id,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                status: 'CONFIRMED'
            });

            setIsAddWizardOpen(false);
            dispatch(fetchClinicAppointments(currentFilters));

            // Reset wizard
            setWizardStep(1);
            setWizardClient(null);
            setWizardServices([]);
            setWizardTime("10:00");
        } catch (error) {
            console.error(error);
            alert("Failed to book appointment.");
        }
    };

    const handleStatusUpdate = async (id: string, st: string) => {
        if (st === 'COMPLETED') {
            setIsPaymentPrompt(true);
            return;
        }
        await dispatch(updateAppointmentStatus({ id, status: st }));
        setSelectedApt({ ...selectedApt, status: st });
        dispatch(fetchClinicAppointments(currentFilters));
    };

    const handleCompletePayment = async () => {
        if (!selectedApt) return;
        try {
            const amountValue = parseFloat(paymentAmt) || 0;
            await dispatch(completeAppointment({
                id: selectedApt.id,
                data: {
                    amountPaid: amountValue,
                    totalAmount: amountValue,
                    paymentMethod: paymentMethod.toUpperCase(),
                    serviceExecuted: true,
                    treatmentDetails: {
                        patientCame: true,
                        notes: 'Checkout confirmed via Sales Calendar'
                    }
                }
            })).unwrap();
            setIsPaymentPrompt(false);
            setIsDetailDrawerOpen(false);
            dispatch(fetchClinicAppointments(currentFilters));
        } catch (err) {
            console.error(err);
            alert("Checkout incomplete. Please verify amount and connection.");
        }
    };

    const openAptDetails = (apt: any) => {
        setSelectedApt(apt);
        setIsPaymentPrompt(false);
        setPaymentAmt(apt.service?.price?.toString() || '');
        setIsDetailDrawerOpen(true);
    };

    return (
        <div className="flex h-full w-full bg-gray-50 relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            {/* Left Sidebar: Team List - MANAGER ONLY */}
            {/* Team List Sidebar - Visible for Managers and Salespeople (to see all) */}
            <div className="w-48 bg-white border-r border-gray-100 flex flex-col hidden lg:flex">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">MY SCHEDULE</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase">{(salespersons || []).length + 1} ACTIVE</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">

                    {isManager && (
                        <>
                            <div
                                onClick={() => setSelectedProviderId('all')}
                                className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${selectedProviderId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-black' : 'hover:bg-gray-50 text-gray-500 font-medium'}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedProviderId === 'all' ? 'bg-indigo-400' : 'bg-indigo-100'}`}>
                                    <Users className={`w-3 h-3 ${selectedProviderId === 'all' ? 'text-white' : 'text-indigo-600'}`} />
                                </div>
                                <span className="text-xs truncate">Full Roster</span>
                            </div>

                            {(salespersons || []).filter(s => s.id !== user?.id).map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedProviderId(s.id)}
                                    className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 group ${selectedProviderId === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-black' : 'hover:bg-gray-50 text-gray-500 font-medium'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedProviderId === s.id ? 'bg-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>{s.firstName?.[0]}</div>
                                    <span className="text-xs truncate">{s.firstName}</span>
                                </div>
                            ))}
                            <div className="h-px bg-gray-100 my-2 mx-2" />
                        </>
                    )}

                    <div
                        onClick={() => setSelectedProviderId(user?.id || '')}
                        className={`p-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 group ${selectedProviderId === user?.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-black' : 'hover:bg-gray-50 text-gray-500 font-medium'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedProviderId === user?.id ? 'bg-indigo-400' : 'bg-indigo-100'}`}>{user?.firstName?.[0]}</div>
                        <span className="text-xs truncate">Me</span>
                    </div>
                </div>
            </div>

            {/* Main Calendar View */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ${isAddWizardOpen || (isDetailDrawerOpen && selectedApt) ? 'mr-96 lg:mr-[400px]' : ''}`}>
                <div className="bg-white border-b border-gray-200 z-10 sticky top-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between px-4 lg:px-6 py-4 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg lg:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    Sales Schedule
                                    <span className="hidden sm:inline-block text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black">LIVE</span>
                                </h1>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Schedule & Dispatch</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-1 w-full sm:w-auto">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(d => viewMode === 'week' ? subWeeks(d, 1) : subDays(d, 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-[11px] font-black text-gray-700 min-w-[120px] text-center uppercase italic">
                                    {viewMode === 'week'
                                        ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[weekDays.length - 1], 'MMM d')}`
                                        : format(viewDate, 'EEEE, MMM d')}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewDate(d => viewMode === 'week' ? addWeeks(d, 1) : addDays(d, 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex-1 sm:flex-none">
                                <select
                                    value={selectedClinicId}
                                    onChange={(e) => setSelectedClinicId(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-lg px-3 py-2 text-[10px] font-black uppercase italic focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none pr-8"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
                                >
                                    <option value="all">Global (All Clinics)</option>
                                    {availableClinics.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-1 items-center bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-indigo-600 px-4' : 'text-gray-400'}`}>Day</button>
                                <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-indigo-600 px-4' : 'text-gray-400'}`}>Week</button>
                            </div>

                            <Button onClick={() => handleOpenWizard()} className="bg-black text-[#CBFF38] hover:bg-zinc-800 font-black uppercase italic text-[10px] h-10 px-4 gap-2 shadow-xl shadow-lime-500/10 border-0">
                                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Apt</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Weekly Stats Header */}
                <div className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Booked</span>
                        <span className="text-sm font-black text-gray-900 leading-none">{weeklyStats.booked}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Done</span>
                        <span className="text-sm font-black text-emerald-700 leading-none">{weeklyStats.done}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-orange-50 rounded-lg border border-orange-100">
                        <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-1">No-show</span>
                        <span className="text-sm font-black text-orange-700 leading-none">{weeklyStats.noShow}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">Canceled</span>
                        <span className="text-sm font-black text-red-700 leading-none">{weeklyStats.cancelled}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Returned</span>
                        <span className="text-sm font-black text-blue-700 leading-none">{weeklyStats.returned}</span>
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
                                        const isBlocked = availability?.blockedTimeSlots?.some(slot => {
                                            const slotStart = new Date(slot.startTime);
                                            if (!isSameDay(slotStart, day)) return false;
                                            return slotStart.getHours() === hour;
                                        });

                                        return (
                                            <div
                                                key={hour}
                                                className={`h-16 border-b border-gray-50/50 w-full hover:bg-indigo-50/10 cursor-alias relative ${isClosed ? 'bg-gray-100/50 pattern-diagonal-lines' : ''} ${isBlocked ? 'bg-orange-50/30' : ''}`}
                                                onClick={(e) => {
                                                    if (isClosed) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setContextMenu({
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top + rect.height / 2,
                                                        visible: true,
                                                        date: day,
                                                        time: `${hour.toString().padStart(2, '0')}:00`
                                                    });
                                                }}
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
                                        const top = (new Date(apt.startTime).getHours()) * 64 + (new Date(apt.startTime).getMinutes() / 60) * 64;
                                        const height = Math.max(((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 3600000) * 64, 40);
                                        const normalizedStatus = (apt.status || 'PENDING').toUpperCase();
                                        const style = statusLabels[normalizedStatus] || statusLabels.PENDING;
                                        const Icon = style.icon;

                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={(e) => { e.stopPropagation(); openAptDetails(apt); }}
                                                className={`absolute left-1 right-1 rounded-md border p-2 shadow-sm cursor-pointer group hover:shadow-md hover:scale-[1.01] z-20 overflow-visible transition-all ${style.color}`}
                                                style={{ top, height }}
                                            >
                                                {/* Tooltip Preview on Hover */}
                                                <div className="absolute left-full ml-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 z-[100] hidden group-hover:block transition-all duration-300 pointer-events-none transform -translate-y-1/2 top-1/2">
                                                    <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-2">
                                                        <div className="flex items-center gap-1.5 text-indigo-600">
                                                            <Clock size={12} strokeWidth={3} />
                                                            <span className="text-[10px] font-black">{format(start, 'HH:mm')} – {format(end, 'HH:mm')}</span>
                                                        </div>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${style.color.split(' ')[0]} ${style.color.split(' ')[1]}`}>{style.label}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-gray-900">{apt.client?.firstName} {apt.client?.lastName}</p>
                                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 leading-none mb-2">
                                                            <Phone size={10} className="text-gray-400" /> {apt.client?.phone || 'No phone'}
                                                        </p>
                                                        <div className="flex justify-between items-center text-[10px] text-gray-700 font-bold bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                            <span className="truncate w-2/3">{apt.service?.name}</span>
                                                            <span className="text-emerald-700 font-black">€{apt.service?.price}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Icon className="w-3 h-3 opacity-80" />
                                                    <span className="text-[10px] font-black uppercase truncate">{apt.client?.firstName} {apt.client?.lastName}</span>
                                                    {(apt as any).isReturned && (
                                                        <span className="text-[7px] px-1 rounded bg-black/10 font-black ml-auto">RET</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[9px] font-bold opacity-80 truncate">{apt.service?.name}</div>
                                                    <div className="text-[8px] font-black text-indigo-600 truncate uppercase mt-0.5">
                                                        {apt.clinic?.name || 'Clinic'} {apt.bookedByInfo?.name ? `| ${apt.bookedByInfo.name}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Appointment Creation Wizard Drawer - Minimal & Compact */}
            {isAddWizardOpen && (
                <div className="fixed top-0 right-0 w-full sm:w-[450px] h-screen bg-white border-l border-slate-200 shadow-[-10px_0_50px_rgba(0,0,0,0.1)] flex flex-col z-[100] animate-in slide-in-from-right transition-all duration-300">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-gray-900 leading-none">New Booking</h2>
                            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Wizard Step {wizardStep} of 2</span>
                        </div>
                        <button onClick={() => setIsAddWizardOpen(false)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"><X size={20} /></button>
                    </div>

                    <div className="flex px-5 py-3 border-b border-gray-100 bg-white items-center text-[10px] font-black text-gray-400 gap-2 uppercase tracking-widest">
                        <span className={wizardStep === 1 ? 'text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100' : 'px-2'}>01. Identity</span>
                        <div className="h-[1px] w-4 bg-slate-200"></div>
                        <span className={wizardStep === 2 ? 'text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100' : 'px-2'}>02. Logistics</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {wizardStep === 1 && (
                            <div className="flex flex-col h-full divide-y divide-slate-100">
                                {/* Section 1: Client Selection */}
                                <div className="p-5 space-y-4 bg-slate-50/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Patient Profile</label>
                                        <div className="flex gap-1 p-0.5 bg-slate-200 rounded-lg">
                                            <button onClick={() => setIsWalkIn(false)} className={`text-[9px] font-black px-3 py-1.5 rounded-md transition-all ${!isWalkIn ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>EXISTING</button>
                                            <button onClick={() => setIsWalkIn(true)} className={`text-[9px] font-black px-3 py-1.5 rounded-md transition-all ${isWalkIn ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>WALK-IN</button>
                                        </div>
                                    </div>

                                    {!isWalkIn ? (
                                        <div className="space-y-3">
                                            <div className="relative group">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search database..."
                                                    className="w-full pl-10 pr-4 py-2.5 border-none rounded-xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all font-bold placeholder:text-slate-300"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                                <div className="flex items-center justify-between px-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Matching Records</p>
                                                    <span className="text-[9px] font-bold text-slate-300">{leads.length} found</span>
                                                </div>
                                                {leads.map(lead => (
                                                    <div
                                                        key={lead.id}
                                                        onClick={() => setWizardClient(lead)}
                                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${wizardClient?.id === lead.id ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-white hover:border-slate-100'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${wizardClient?.id === lead.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                {lead.firstName[0]}{lead.lastName[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-xs leading-none mb-1">{lead.firstName} {lead.lastName}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{lead.phone || lead.email || 'No contact info'}</p>
                                                            </div>
                                                        </div>
                                                        {wizardClient?.id === lead.id && <CheckCircle2 size={12} className="text-indigo-600" />}
                                                    </div>
                                                ))}
                                                {leads.length === 0 && searchQuery && <p className="text-[10px] text-center text-slate-400 py-4 font-bold uppercase italic">No Matches Found</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 bg-white p-4 rounded-xl shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="First Name *" value={walkInForm.firstName} onChange={(e) => setWalkInForm({ ...walkInForm, firstName: e.target.value })} className="w-full p-2.5 border border-slate-100 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-bold italic" />
                                                <input type="text" placeholder="Last Name" value={walkInForm.lastName} onChange={(e) => setWalkInForm({ ...walkInForm, lastName: e.target.value })} className="w-full p-2.5 border border-slate-100 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-bold italic" />
                                            </div>
                                            <input type="text" placeholder="Phone Number *" value={walkInForm.phone} onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-100 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-bold italic" />
                                        </div>
                                    )}
                                </div>

                                {/* Section 2: Service Selection */}
                                <div className="flex-1 p-5 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">Service Logic</label>
                                            <div
                                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all"
                                                onClick={() => setIsClinicDropdownOpen(!isClinicDropdownOpen)}
                                            >
                                                <MapPin size={10} />
                                                <span className="truncate max-w-[100px]">{wizardClinic?.name || 'Switch Clinic'}</span>
                                            </div>
                                        </div>

                                        {isClinicDropdownOpen && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-2 animate-in zoom-in-95 duration-200">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Quick search clinic..."
                                                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-100 rounded-lg text-xs font-bold outline-none ring-offset-0 focus:ring-2 focus:ring-indigo-100"
                                                        value={clinicSearchQuery}
                                                        onChange={(e) => setClinicSearchQuery(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1">
                                                    {availableClinics
                                                        .filter(c => c.name.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
                                                        .map(c => (
                                                            <div
                                                                key={c.id}
                                                                className={`px-3 py-2 text-[10px] font-black cursor-pointer transition-all flex items-center justify-between rounded-md ${wizardClinic?.id === c.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                                                                onClick={async () => {
                                                                    setWizardClinic(c);
                                                                    setIsClinicDropdownOpen(false);
                                                                    setClinicSearchQuery('');
                                                                    try {
                                                                        const srvRes = await clinicsAPI.getServices(c.id);
                                                                        setAvailableServices(srvRes.data);
                                                                    } catch (err) { console.error(err); }
                                                                }}
                                                            >
                                                                <span>{c.name}</span>
                                                                {wizardClinic?.id === c.id && <CheckCircle2 size={10} />}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Find treatment..."
                                            className="w-full pl-10 pr-4 py-2.5 border-none rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all font-bold placeholder:text-slate-300"
                                            value={serviceSearchQuery}
                                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.entries(
                                            (availableServices || [])
                                                .filter(s => (s.treatment?.name || s.name || '').toLowerCase().includes(serviceSearchQuery.toLowerCase()))
                                                .reduce((acc: any, srv) => {
                                                    const cat = srv.treatment?.category || 'General';
                                                    if (!acc[cat]) acc[cat] = [];
                                                    acc[cat].push(srv);
                                                    return acc;
                                                }, {})
                                        ).map(([category, services]: [string, any]) => (
                                            <div key={category} className="space-y-1.5 mb-3">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] pl-1 mb-1">{category}</p>
                                                {services.map((srv: any) => {
                                                    const isSelected = wizardServices.find(s => s.id === srv.id);
                                                    return (
                                                        <div
                                                            key={srv.id}
                                                            onClick={() => {
                                                                if (isSelected) setWizardServices(ws => ws.filter(x => x.id !== srv.id));
                                                                else setWizardServices([...wizardServices, srv]);
                                                            }}
                                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center group/item ${isSelected ? 'border-emerald-500 bg-white shadow-sm' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                    <Scissors size={12} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className="font-black text-slate-900 text-[11px] leading-none mb-1">{srv.treatment?.name || srv.name}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter ">{srv.durationMinutes || srv.duration}M · €{srv.price}</p>
                                                                </div>
                                                            </div>
                                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        {availableServices.length === 0 && <p className="text-[10px] text-center text-slate-400 py-6 uppercase font-black italic">Select Clinic first</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="p-5 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Professional</label>
                                        <select
                                            className="w-full mt-2 p-3 border-none rounded-xl text-sm bg-slate-50 font-black cursor-pointer ring-offset-0 focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={wizardProviderId || user?.id || ''}
                                            onChange={(e) => setWizardProviderId(e.target.value)}
                                        >
                                            <option value={user?.id}>Personal Schedule ({user?.firstName})</option>
                                            {isManager && (salespersons || []).filter(s => s.id !== user?.id).map(s => (
                                                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Date</label>
                                            <div className="relative mt-2">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                                <input type="date" value={format(wizardDate, 'yyyy-MM-dd')} onChange={(e) => setWizardDate(parseISO(e.target.value))} className="w-full pl-10 pr-3 py-3 border-none rounded-xl text-sm bg-slate-50 font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Custom Time</label>
                                            <div className="relative mt-2">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                                <input type="time" value={wizardTime} onChange={(e) => setWizardTime(e.target.value)} className="w-full pl-10 pr-3 py-3 border-none rounded-xl text-sm bg-slate-50 font-black outline-none focus:ring-2 focus:ring-indigo-100" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Available Windows</label>
                                            {isLoadingSlots && <span className="text-[9px] font-black text-indigo-500 animate-pulse tracking-tighter uppercase">Computing...</span>}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                            {availableTimeSlots.map((slot: any, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setWizardTime(format(new Date(slot.startTime), 'HH:mm'))}
                                                    className={`py-2 text-center text-[10px] font-black rounded-lg border-2 cursor-pointer transition-all ${wizardTime === format(new Date(slot.startTime), 'HH:mm')
                                                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                                                        : 'border-transparent hover:border-indigo-100 text-slate-600 bg-slate-50'
                                                        }`}
                                                >
                                                    {format(new Date(slot.startTime), 'HH:mm')}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 mx-5 p-5 rounded-2xl text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Engagement</span>
                                                <p className="text-sm font-black text-white/90">{isWalkIn ? walkInForm.firstName : (wizardClient?.firstName + ' ' + (wizardClient?.lastName || '')) || 'Guest Patient'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Value</span>
                                                <p className="text-xl font-black text-[#CBFF38]">€{wizardServices.reduce((a, b) => a + parseFloat(b.price || '0'), 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Assigned To</span>
                                                <p className="text-[11px] font-black text-white/80 uppercase italic">{salespersons.find(s => s.id === (wizardProviderId || user?.id))?.firstName || user?.firstName}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Service Count</span>
                                                <p className="text-[11px] font-black text-white/80 uppercase">{wizardServices.length} ITEMS SELECTED</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-white border-t border-slate-100 mt-auto shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
                        <div className="flex gap-3">
                            {wizardStep === 2 && (
                                <Button variant="outline" onClick={() => setWizardStep(1)} className="h-14 w-14 p-0 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                onClick={wizardStep === 1 ? () => setWizardStep(2) : handleCreateBooking}
                                disabled={wizardStep === 1 ? (!wizardClient && !isWalkIn) || wizardServices.length === 0 : !wizardTime}
                                className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all active:scale-[0.98] shadow-xl ${wizardStep === 1 ? 'bg-slate-900 text-white hover:bg-black' : 'bg-[#CBFF38] text-slate-900 hover:bg-[#A3D900] shadow-[#CBFF38]/20'}`}
                            >
                                {wizardStep === 1 ? 'Configure Schedule' : 'Launch Appointment'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Appointment Detail Drawer */}
            {isDetailDrawerOpen && selectedApt && (
                <div className="fixed top-0 right-0 w-[400px] h-screen bg-white border-l border-gray-200 shadow-2xl flex flex-col z-[100] animate-in slide-in-from-right">
                    <div className="p-6 text-white bg-gradient-to-br from-slate-800 to-indigo-900">
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
                        <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Client Contact</p>
                            <p className="text-xs font-bold">{selectedApt.client?.phone || 'No phone'}</p>
                            <p className="text-xs font-bold opacity-80">{selectedApt.client?.email}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 bg-white/10 p-3 rounded-lg border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/50 uppercase">Clinic</span>
                                <span className="text-xs font-black truncate">{selectedApt.clinic?.name || 'Main Clinic'}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10 pl-3">
                                <span className="text-[9px] font-bold text-white/50 uppercase">Salesperson</span>
                                <span className="text-xs font-black truncate">{selectedApt.bookedByInfo?.name || 'System'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Service Details</p>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{selectedApt.serviceName || selectedApt.service?.treatment?.name || selectedApt.service?.name || 'Service'}</p>
                                    <p className="text-xs text-gray-500">{selectedApt.service?.durationMinutes || selectedApt.service?.duration || '–'} mins</p>
                                </div>
                                <span className="text-lg font-black text-gray-900">€{selectedApt.service?.price ?? selectedApt.totalAmount ?? '–'}</span>
                            </div>
                        </div>

                        {/* Rescheduling & Reassignment (Requirement 12c) */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 text-indigo-700">
                                <Calendar size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Reschedule & Reassign</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase leading-none px-1">Date</label>
                                    <input
                                        type="date"
                                        value={format(new Date(selectedApt.startTime), 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const d = new Date(e.target.value);
                                            const old = new Date(selectedApt.startTime);
                                            d.setHours(old.getHours(), old.getMinutes());
                                            setSelectedApt({ ...selectedApt, startTime: d.toISOString() });
                                        }}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase leading-none px-1">Time</label>
                                    <input
                                        type="time"
                                        value={format(new Date(selectedApt.startTime), 'HH:mm')}
                                        onChange={(e) => {
                                            const [h, m] = e.target.value.split(':').map(Number);
                                            const d = new Date(selectedApt.startTime);
                                            d.setHours(h, m);
                                            setSelectedApt({ ...selectedApt, startTime: d.toISOString() });
                                        }}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase leading-none px-1">Staff Assigned</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none transition-all cursor-pointer"
                                    value={selectedApt.providerId || ''}
                                    onChange={(e) => setSelectedApt({ ...selectedApt, providerId: e.target.value })}
                                >
                                    {!selectedApt.providerId && <option value="">– Unassigned –</option>}
                                    {/* Current provider first if not in salespersons list */}
                                    {selectedApt.providerName && !salespersons.find((s: any) => s.id === selectedApt.providerId) && (
                                        <option value={selectedApt.providerId}>{selectedApt.providerName}</option>
                                    )}
                                    {/* All team members */}
                                    <option value={user?.id}>Me ({user?.firstName} {user?.lastName})</option>
                                    {isManager && (salespersons || []).filter((s: any) => s.id !== user?.id).map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full py-2.5 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-black text-[9px] uppercase tracking-widest rounded-xl"
                                onClick={async () => {
                                    try {
                                        await bookingAPI.updateAppointment(selectedApt.id, {
                                            startTime: selectedApt.startTime,
                                            providerId: selectedApt.providerId
                                        });
                                        dispatch(fetchClinicAppointments({ providerId: user?.id }));
                                        alert("Appointment rescheduled successfully.");
                                    } catch (err) { alert("Reschedule failed."); }
                                }}
                            >
                                Confirm Updates
                            </Button>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Status</p>
                            <select
                                value={selectedApt.status}
                                onChange={(e) => handleStatusUpdate(selectedApt.id, e.target.value)}
                                disabled={selectedApt.status === 'COMPLETED'}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-indigo-500 outline-none"
                            >
                                <option value="PENDING">Booked</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="ARRIVED">Arrived</option>
                                <option value="IN_PROGRESS">Started</option>
                                <option value="NO_SHOW">No Show</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="COMPLETED">Done (Completed)</option>
                            </select>
                        </div>

                        {(selectedApt.status === 'COMPLETED' || isPaymentPrompt) && (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <CreditCard size={18} /> <h3 className="font-black">{selectedApt.status === 'COMPLETED' ? 'Financial Record' : 'Capture Payment'}</h3>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Amount (€)</label>
                                    <input
                                        type="number"
                                        value={paymentAmt}
                                        onChange={e => setPaymentAmt(e.target.value)}
                                        className="w-full mt-1 p-3 border border-emerald-200 rounded-xl text-emerald-900 font-black focus:bg-white outline-none shadow-inner"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {(['cash', 'card'] as const).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={`flex-1 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${paymentMethod === m ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-600 border border-emerald-100'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={handleCompletePayment} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg uppercase text-[10px] tracking-widest">
                                    {selectedApt.status === 'COMPLETED' ? 'Update Amount' : 'Confirm & Collect'}
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full h-11 border-red-50 text-red-500 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                onClick={async () => {
                                    if (window.confirm("ARE YOU SURE? This will soft-delete the appointment and VOID all related revenue records. This action is audited.")) {
                                        try {
                                            await bookingAPI.deleteAppointment(selectedApt.id);
                                            setIsDetailDrawerOpen(false);
                                            dispatch(fetchClinicAppointments({ providerId: user?.id }));
                                        } catch (err) { alert("Delete failed."); }
                                    }
                                }}
                            >
                                <XCircle className="w-4 h-4" /> Delete Appointment
                            </Button>
                            <p className="text-[9px] text-gray-400 text-center uppercase font-bold px-4">Soft-Delete Only (Hidden from View & Analytics)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu (Click Empty Slot) */}
            {contextMenu && contextMenu.visible && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setContextMenu(null)} />
                    <div
                        className="fixed z-[120] bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 w-64 animate-in fade-in zoom-in duration-150"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <div className="p-3 border-b border-gray-50 mb-1 text-center bg-gray-50/50 rounded-t-lg">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(contextMenu.date, 'EEEE, MMM d')}</p>
                            <p className="text-sm font-black text-indigo-700">{contextMenu.time}</p>
                        </div>
                        <button
                            onClick={() => {
                                handleOpenWizard(contextMenu.date, contextMenu.time);
                                setContextMenu(null);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-lg text-sm font-bold transition-all group"
                        >
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-all"><Plus size={14} /></div>
                            Add Appointment
                        </button>
                        <button
                            onClick={() => {
                                setViewDate(contextMenu.date);
                                setViewMode('day');
                                setContextMenu(null);
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-lg text-sm font-bold transition-all group"
                        >
                            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-all"><Calendar size={14} /></div>
                            Go to Day View
                        </button>
                        <button
                            onClick={async () => {
                                if (selectedClinicId === 'all') return alert("Please select a clinic first.");
                                try {
                                    const startTime = setMinutes(setHours(startOfDay(contextMenu.date), parseInt(contextMenu.time)), 0);
                                    const end = new Date(startTime.getTime() + 60 * 60000);

                                    await bookingAPI.createBlockedSlot({
                                        clinicId: selectedClinicId,
                                        providerId: selectedProviderId === 'all' ? null : selectedProviderId,
                                        startTime: startTime.toISOString(),
                                        endTime: end.toISOString(),
                                        reason: 'Staff Break / Admin Block'
                                    });
                                    setContextMenu(null);
                                    dispatch(fetchClinicAppointments({ clinicId: selectedClinicId !== 'all' ? selectedClinicId : undefined }));
                                } catch (err) {
                                    console.error(err);
                                    alert("Failed to block slot.");
                                }
                            }}
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-orange-50 text-gray-700 hover:text-orange-700 rounded-lg text-sm font-bold transition-all group"
                        >
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md group-hover:bg-orange-600 group-hover:text-white transition-all"><XCircle size={14} /></div>
                            Block Time
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
