import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    format,
    addDays,
    addMinutes,
    isSameDay,
    startOfWeek,
    eachDayOfInterval,
    endOfWeek,
    setHours,
    setMinutes,
    isToday
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    User as UserIcon,
    Calendar as CalendarIcon,
    MoreHorizontal,
    Clock
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchAppointments, fetchClinicProviders } from '@/store/slices/clinicSlice';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import './StaffDiary.css';

interface StaffDiaryProps {
    clinicId?: string;
    onNewAppointment?: () => void;
}

export const StaffDiary: React.FC<StaffDiaryProps> = ({ clinicId, onNewAppointment }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { appointments, staff: allStaff, profile, isLoading } = useSelector((state: RootState) => state.clinic);
    const { user } = useSelector((state: RootState) => state.auth);

    const filteredAppointments = useMemo(() => {
        if (user?.role === 'doctor') {
            return appointments.filter(apt => apt.providerId === user.id);
        }
        return appointments;
    }, [appointments, user]);

    const staff = useMemo(() => {
        let baseStaff = [...allStaff];

        // If user is a doctor, only show their own column
        if (user?.role === 'doctor') {
            return baseStaff.filter(s => s.id === user.id);
        }

        // For others (Admin, Owner), show "Unassigned" column as well
        const unassigned = {
            id: 'unassigned',
            fullName: 'Unassigned',
            role: 'No Provider',
            profilePictureUrl: null
        };

        return [unassigned, ...baseStaff];
    }, [allStaff, user]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [searchQuery, setSearchQuery] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    const timeSlots = useMemo(() => {
        const slots = [];
        let current = setMinutes(setHours(new Date(), 0), 0); // Start at 12 AM
        const end = setMinutes(setHours(new Date(), 23), 30); // End at 11:30 PM

        while (current <= end) {
            slots.push(format(current, 'HH:mm'));
            current = addMinutes(current, 30);
        }
        return slots;
    }, []);

    useEffect(() => {
        const targetClinicId = clinicId || profile?.id || (user as any)?.associatedClinicId || (user as any)?.ownedClinics?.[0]?.id;

        if (targetClinicId) {
            dispatch(fetchClinicProviders(targetClinicId));
        }

        // Pass clinicId and selectedDate in filters
        const filters: any = {};
        if (targetClinicId) filters.clinicId = targetClinicId;
        if (selectedDate) filters.date = format(selectedDate, 'yyyy-MM-dd');
        
        dispatch(fetchAppointments(filters));
    }, [dispatch, profile?.id, clinicId, selectedDate, user]);

    const navigateDate = (direction: 'prev' | 'next') => {
        if (viewMode === 'day') {
            setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
        } else if (viewMode === 'week') {
            setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
        }
    };

    const getAppointmentsForProvider = (providerId: string, date: Date) => {
        return filteredAppointments.filter(apt => {
            const matchesProvider =
                (providerId === 'unassigned' && !apt.providerId) ||
                (apt.providerId === providerId);

            return matchesProvider && isSameDay(new Date(apt.startTime), date);
        });
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        });

        return (
            <div className="diary-grid-container week-view">
                <div className="diary-time-column">
                    <div className="diary-header-cell spacer"></div>
                    {timeSlots.map(time => (
                        <div key={time} className="diary-time-cell">{time}</div>
                    ))}
                </div>
                <div className="diary-week-columns flex-1 flex overflow-x-auto">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="diary-day-column flex-1 min-w-[150px] border-right border-gray-100">
                            <div className={`diary-header-cell flex-col ${isToday(day) ? 'bg-indigo-50/30' : ''}`}>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(day, 'EEE')}</span>
                                <span className={`text-lg font-black ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>{format(day, 'd')}</span>
                            </div>
                            <div className="diary-slots-container relative">
                                {timeSlots.map(time => (
                                    <div key={time} className="diary-slot-cell"></div>
                                ))}
                                {filteredAppointments.filter(apt => isSameDay(new Date(apt.startTime), day)).map(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                                    const dayStartMinutes = 0 * 60;
                                    const top = ((startMinutes - dayStartMinutes) / 30) * 60;
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                    const height = (duration / 30) * 60;

                                    return (
                                        <div
                                            key={apt.id}
                                            className={`appointment-block compact status-${apt.status}`}
                                            style={{ top: `${top}px`, height: `${height - 2}px` }}
                                        >
                                            <div className="text-[9px] font-black leading-tight text-gray-900 truncate">{apt.serviceName || (apt.service as any)?.treatment?.name || (apt.service as any)?.name}</div>
                                            <div className="text-[8px] font-bold text-gray-500 truncate">{apt.clientDetails?.fullName || 'Client'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderDayView = () => (
        <div className="flex h-full overflow-hidden">
            {/* Time Column */}
            <div className="w-[60px] flex-shrink-0 border-r border-gray-50 bg-gray-50/10">
                <div className="h-14 border-b border-gray-50 flex items-center justify-center p-2 bg-gray-50/20">
                    <Clock size={12} className="text-gray-400" />
                </div>
                <div className="overflow-y-auto no-scrollbar h-[calc(100%-56px)]">
                    {timeSlots.map(time => (
                        <div key={time} className="h-14 flex items-center justify-center text-[9px] font-black text-gray-300 italic border-b border-gray-50/50">
                            {time}
                        </div>
                    ))}
                </div>
            </div>

            {/* Staff Columns */}
            <div className="flex-1 overflow-x-auto custom-scrollbar bg-white">
                <div className="flex min-h-full" style={{ width: `${Math.max(staff.length * 220, 800)}px` }}>
                    {staff.map(member => (
                        <div key={member.id} className="w-[220px] flex-shrink-0 border-r border-gray-50 relative group/col transition-colors duration-300">
                            {/* Staff Header */}
                            <div className="h-14 px-4 border-b border-gray-50 flex items-center gap-3 bg-white sticky top-0 z-20">
                                <div className="size-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover/col:border-black transition-all">
                                    {member.profilePictureUrl ? (
                                        <img src={member.profilePictureUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={14} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase italic tracking-tighter text-gray-900 leading-none truncate mb-0.5">{member.fullName}</p>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-gray-400 truncate">{member.role?.replace('_', ' ')}</p>
                                </div>
                            </div>

                            {/* Grid Slots */}
                            <div className="relative">
                                {timeSlots.map(time => (
                                    <div key={time} className="h-14 border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors pointer-events-none" />
                                ))}

                                {/* Appointments */}
                                {getAppointmentsForProvider(member.id, selectedDate).map(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                                    const top = (startMinutes / 30) * 56;
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                    const height = (duration / 30) * 56;

                                    return (
                                        <div
                                            key={apt.id}
                                            className={`absolute left-2 right-2 rounded-xl p-3 border-l-4 shadow-sm group hover:scale-[1.02] hover:z-30 transition-all cursor-pointer status-${apt.status}`}
                                            style={{ top: `${top + 4}px`, height: `${height - 8}px` }}
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <p className="text-[10px] font-black uppercase italic tracking-tighter text-gray-900 leading-tight truncate">
                                                    {apt.serviceName || (apt.service as any)?.name || 'Procedure'}
                                                </p>
                                                <MoreHorizontal size={10} className="text-gray-400 shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                                                <UserIcon size={8} className="text-gray-400 shrink-0" />
                                                <p className="text-[8px] font-bold text-gray-500 truncate">{apt.clientDetails?.fullName || 'Walk-in'}</p>
                                            </div>
                                            <div className="absolute bottom-2 right-2 text-[8px] font-black italic text-gray-400 tabular-nums">
                                                {format(start, 'HH:mm')}
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
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Minimal Header */}
            <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="size-1.5 rounded-full bg-green-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Diary Terminal</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Clinic Diary</h1>
                                <p className="text-gray-500 font-medium max-w-md text-sm">Real-time scheduling matrix and clinician deployment.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Nav */}
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                <button onClick={() => navigateDate('prev')} className="size-9 flex items-center justify-center hover:bg-white rounded-lg transition-all text-gray-500">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 px-2 min-w-[140px] text-center italic">
                                    {format(selectedDate, 'EEE, MMM do, yyyy')}
                                </span>
                                <button onClick={() => navigateDate('next')} className="size-9 flex items-center justify-center hover:bg-white rounded-lg transition-all text-gray-500">
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* View Switcher */}
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-hidden">
                                {(['day', 'week', 'month'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsBookingModalOpen(true)}
                                className="h-11 px-6 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all shadow-lg flex items-center gap-3"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">New Appointment</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px] relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-black italic">Syncing...</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-hidden transition-all duration-300">
                        {viewMode === 'day' ? renderDayView() : viewMode === 'week' ? renderWeekView() : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
                                <CalendarIcon className="w-12 h-12 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">{viewMode} View Standby</p>
                                <button onClick={() => setViewMode('day')} className="text-[#CBFF38] bg-black px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Day View</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status legend */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    {[
                        { label: 'Booked', color: 'bg-indigo-500' },
                        { label: 'Completed', color: 'bg-emerald-500' },
                        { label: 'Arrived', color: 'bg-amber-500' },
                        { label: 'No Show', color: 'bg-red-500' },
                        { label: 'Cancelled', color: 'bg-gray-300' }
                    ].map(status => (
                        <div key={status.label} className="flex items-center gap-3 group">
                            <div className={`w-3 h-3 rounded-full ${status.color} shadow-sm group-hover:scale-125 transition-transform`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors italic">{status.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Booking Modal */}
            <CRMBookingModal 
              isOpen={isBookingModalOpen} 
              onClose={() => setIsBookingModalOpen(false)}
              clinicId={clinicId || profile?.id || (user as any)?.associatedClinicId || (user as any)?.ownedClinics?.[0]?.id}
              onSuccess={() => {
                const targetClinicId = clinicId || profile?.id || (user as any)?.associatedClinicId || (user as any)?.ownedClinics?.[0]?.id;
                const filters: any = {};
                if (targetClinicId) filters.clinicId = targetClinicId;
                if (selectedDate) filters.date = format(selectedDate, 'yyyy-MM-dd');
                dispatch(fetchAppointments(filters));
              }}
            />
        </div>
    );
};
