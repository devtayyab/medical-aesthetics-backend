import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    Scissors,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronDown,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameDay, startOfDay, addHours, isToday, addWeeks, subWeeks, subDays } from 'date-fns';
import { AppDispatch, RootState } from '@/store';
import { fetchClinicAppointments, updateAppointmentStatus } from '@/store/slices/bookingSlice';
import { fetchSalespersons } from '@/store/slices/crmSlice';
import { Button } from '@/components/atoms/Button/Button';

// Translation helpers based on user request
const statusLabels: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: 'Booked', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    arrived: { label: 'Arrived', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: User },
    in_progress: { label: 'Started', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Scissors },
    no_show: { label: 'No-show', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    completed: { label: 'Done', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 },
};

export const BookingCalendar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { appointments } = useSelector((state: RootState) => state.booking);
    const { salespersons } = useSelector((state: RootState) => state.crm);
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
    const [selectedProvider, setSelectedProvider] = useState<string>('all');

    useEffect(() => {
        dispatch(fetchSalespersons());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchClinicAppointments({
            date: format(viewDate, 'yyyy-MM-dd'),
            providerId: selectedProvider === 'all' ? undefined : selectedProvider
        }));
    }, [dispatch, viewDate, selectedProvider]);

    const weekDays = useMemo(() => {
        if (viewMode === 'day') return [startOfDay(viewDate)];
        return eachDayOfInterval({
            start: startOfWeek(viewDate, { weekStartsOn: 1 }),
            end: endOfWeek(viewDate, { weekStartsOn: 1 })
        });
    }, [viewDate, viewMode]);

    const hours = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00

    const handleStatusUpdate = (appointmentId: string, status: string) => {
        dispatch(updateAppointmentStatus({ id: appointmentId, status }));
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden border border-gray-100 rounded-2xl shadow-xl">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-indigo-600" />
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Booking Calendar</h1>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-4 rounded-md transition-all ${viewMode === 'day' ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setViewMode('day')}
                        >
                            Day
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-4 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setViewMode('week')}
                        >
                            Week
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(d => viewMode === 'week' ? subWeeks(d, 1) : subDays(d, 1))}>
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-[13px] font-bold text-gray-700 min-w-[120px] text-center">
                            {viewMode === 'week'
                                ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[weekDays.length - 1], 'MMM d, yyyy')}`
                                : format(viewDate, 'EEEE, MMM d, yyyy')}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(d => viewMode === 'week' ? addWeeks(d, 1) : addDays(d, 1))}>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" className="text-[10px] h-6 px-1.5 font-bold hover:bg-white ml-2 border border-transparent hover:border-gray-200" onClick={() => setViewDate(new Date())}>Today</Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                            >
                                <option value="all">All Professionals</option>
                                {salespersons.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-1.5 py-1.5 h-8 text-xs font-bold shadow-lg shadow-indigo-100">
                            <Plus className="w-3.5 h-3.5" />
                            New
                        </Button>
                    </div>
                </div>
            </div>

            {/* Calendar Multi-View Grid */}
            <div className="flex-1 overflow-auto flex scrollbar-hide">
                {/* Time Strip */}
                <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 pt-10 sticky left-0 z-20">
                    {hours.map(hour => (
                        <div key={hour} className="h-14 flex items-start justify-center text-[10px] font-bold text-gray-400 -mt-2">
                            {hour.toString().padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} min-w-[1000px] relative`}>
                    {weekDays.map((day) => (
                        <div key={day.toISOString()} className={`relative border-r border-gray-100 ${isToday(day) ? 'bg-indigo-50/5' : ''}`}>
                            {/* Day Header */}
                            <div className={`h-10 border-b border-gray-100 flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-10 ${isToday(day) ? 'text-indigo-600' : 'text-gray-500'}`}>
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{format(day, 'EEE')}</span>
                                <span className={`text-sm font-black ${isToday(day) ? 'text-indigo-700' : 'text-gray-900'}`}>{format(day, 'd')}</span>
                                {isToday(day) && <div className="absolute bottom-0 w-full h-[2px] bg-indigo-600" />}
                            </div>

                            {/* Hour Slots */}
                            <div className="relative h-[1344px]"> {/* 24 hours * 56px */}
                                {hours.map(hour => (
                                    <div key={hour} className="h-14 border-b border-gray-50/50 w-full" />
                                ))}

                                {/* Appointments Area */}
                                {appointments && appointments.filter(apt => isSameDay(new Date(apt.startTime), day)).map(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const top = (start.getHours()) * 56 + (start.getMinutes() / 60) * 56;
                                    const lengthInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    const height = lengthInHours * 56;
                                    const statusStyle = statusLabels[apt.status] || statusLabels.pending;
                                    const Icon = statusStyle.icon;

                                    return (
                                        <div
                                            key={apt.id}
                                            className={`absolute left-1 right-1 rounded-lg border p-1.5 shadow-md transition-all hover:scale-[1.02] hover:z-20 ring-1 ring-inset ring-white/20 group cursor-pointer overflow-hidden ${statusStyle.color}`}
                                            style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <Icon className="w-3 h-3 flex-shrink-0 opacity-80" />
                                                        <span className="text-[10px] font-black uppercase tracking-tight truncate leading-tight">
                                                            {apt.client?.firstName} {apt.client?.lastName || 'Client'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-bold opacity-90 truncate leading-tight bg-white/30 px-1 py-0.5 rounded-md inline-block">
                                                        {apt.service?.name || 'Service'}
                                                    </span>
                                                </div>

                                                {/* Status Selector Dropdown (Simple version for demo) */}
                                                <select
                                                    value={apt.status}
                                                    onChange={(e) => handleStatusUpdate(apt.id, e.target.value)}
                                                    className="bg-transparent border-none text-[9px] font-bold focus:ring-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    {Object.entries(statusLabels).map(([val, { label }]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {height > 50 && (
                                                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 opacity-60">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    <span className="text-[9px] font-black tracking-tight">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</span>
                                                </div>
                                            )}
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
};
