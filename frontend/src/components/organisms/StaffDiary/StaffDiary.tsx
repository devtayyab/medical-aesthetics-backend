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
    Clock,
    User as UserIcon,
    Calendar as CalendarIcon,
    MoreHorizontal
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchAppointments, fetchClinicProviders } from '@/store/slices/clinicSlice';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import './StaffDiary.css';

interface StaffDiaryProps {
    clinicId?: string;
}

export const StaffDiary: React.FC<StaffDiaryProps> = ({ clinicId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { appointments, staff, profile, isLoading } = useSelector((state: RootState) => state.clinic);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [searchQuery, setSearchQuery] = useState('');

    const timeSlots = useMemo(() => {
        const slots = [];
        let current = setMinutes(setHours(new Date(), 8), 0); // Start at 8 AM
        const end = setMinutes(setHours(new Date(), 20), 0); // End at 8 PM

        while (current <= end) {
            slots.push(format(current, 'HH:mm'));
            current = addMinutes(current, 30);
        }
        return slots;
    }, []);

    useEffect(() => {
        const targetClinicId = clinicId || profile?.id;

        if (targetClinicId) {
            dispatch(fetchClinicProviders(targetClinicId));
        }

        // Pass clinicId in filters if provided, otherwise fetch for user's associated clinic (default behavior)
        const filters = clinicId ? { clinicId } : undefined;
        dispatch(fetchAppointments(filters));
    }, [dispatch, profile?.id, clinicId]);

    const navigateDate = (direction: 'prev' | 'next') => {
        if (viewMode === 'day') {
            setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
        } else if (viewMode === 'week') {
            setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
        }
    };

    const getAppointmentsForProvider = (providerId: string, date: Date) => {
        return appointments.filter(apt =>
            apt.providerId === providerId &&
            isSameDay(new Date(apt.startTime), date)
        );
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
                                {appointments.filter(apt => isSameDay(new Date(apt.startTime), day)).map(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                                    const dayStartMinutes = 8 * 60;
                                    const top = ((startMinutes - dayStartMinutes) / 30) * 60;
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                    const height = (duration / 30) * 60;

                                    return (
                                        <div
                                            key={apt.id}
                                            className={`appointment-block compact status-${apt.status}`}
                                            style={{ top: `${top + 60}px`, height: `${height - 2}px` }}
                                        >
                                            <div className="text-[9px] font-black leading-tight text-gray-900 truncate">{apt.service?.name}</div>
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
        <div className="diary-grid-container">
            <div className="diary-time-column">
                <div className="diary-header-cell spacer"></div>
                {timeSlots.map(time => (
                    <div key={time} className="diary-time-cell">
                        {time}
                    </div>
                ))}
            </div>
            <div className="diary-staff-columns custom-scrollbar">
                <div className="diary-staff-scroll-wrapper" style={{ width: `${Math.max(staff.length * 200, 800)}px` }}>
                    {staff.map(member => (
                        <div key={member.id} className="diary-staff-column">
                            <div className="diary-header-cell staff-info">
                                <div className="staff-avatar">
                                    {member.profilePictureUrl ? (
                                        <img src={member.profilePictureUrl} alt={member.fullName} />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="staff-meta">
                                    <span className="staff-name">{member.fullName}</span>
                                    <span className="staff-role">{member.role?.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="diary-slots-container">
                                {timeSlots.map(time => (
                                    <div key={time} className="diary-slot-cell" onClick={() => console.log('Book at', time, 'for', member.fullName)}></div>
                                ))}
                                {getAppointmentsForProvider(member.id, selectedDate).map(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                                    const dayStartMinutes = 8 * 60;
                                    const top = ((startMinutes - dayStartMinutes) / 30) * 60; // 60px per 30 mins
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                    const height = (duration / 30) * 60;

                                    return (
                                        <div
                                            key={apt.id}
                                            className={`appointment-block status-${apt.status}`}
                                            style={{ top: `${top + 60}px`, height: `${height - 4}px` }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="apt-info">
                                                    <span className="apt-service">{apt.service?.name}</span>
                                                    <span className="apt-client">{apt.clientDetails?.fullName || 'Walk-in'}</span>
                                                </div>
                                                <button className="p-1 hover:bg-black/5 rounded-md">
                                                    <MoreHorizontal className="w-3 h-3 text-gray-400" />
                                                </button>
                                            </div>
                                            <div className="apt-time">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
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
        <div className="staff-diary-root">
            {/* Toolbar */}
            <div className="diary-toolbar">
                <div className="toolbar-left">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Diary</h1>
                    <div className="date-nav">
                        <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')} className="nav-btn">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <span className="current-date-display font-bold">
                            {format(selectedDate, 'EEEE, MMM do, yyyy')}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} className="nav-btn">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="toolbar-right">
                    <div className="view-switcher bg-gray-100 p-1 rounded-xl flex">
                        {(['day', 'week', 'month'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    <div className="search-box relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search client..."
                            className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20">
                        <Plus className="w-4 h-4 mr-2" /> New Appointment
                    </Button>
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="diary-content-area relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Syncing Diary...</span>
                        </div>
                    </div>
                )}
                <Card className="diary-card border-none shadow-2xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-0 h-full">
                        {viewMode === 'day' ? renderDayView() : viewMode === 'week' ? renderWeekView() : (
                            <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
                                <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p className="font-bold">{viewMode.toUpperCase()} VIEW UNDER DEVELOPMENT</p>
                                <Button variant="link" onClick={() => setViewMode('day')}>Return to Day View</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status Footer */}
            <div className="diary-footer mt-6 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" /> Booked
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Completed
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" /> Arrived
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" /> No Show
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300" /> Cancelled
                </div>
            </div>
        </div>
    );
};
