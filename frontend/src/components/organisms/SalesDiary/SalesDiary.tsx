import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    format,
    addDays,
    addMinutes,
    isSameDay,
    setHours,
    setMinutes,
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    User as UserIcon,
    Phone,
    Mail,
    MessageSquare,
    CheckCircle2,
    Calendar as CalendarIcon,
    Clock
} from 'lucide-react';
import { SalesBookingsModal } from './SalesBookingsModal';
import { RootState, AppDispatch } from '@/store';
import { fetchSalespersons, fetchSalesActivities } from '@/store/slices/crmSlice';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import './SalesDiary.css';
import { startOfWeek, eachDayOfInterval, endOfWeek, isToday } from 'date-fns';

interface SalesDiaryProps {
    salespersonId?: string;
}

export const SalesDiary: React.FC<SalesDiaryProps> = ({ salespersonId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { salespersons, diaryActivities, isLoading } = useSelector((state: RootState) => state.crm);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [searchQuery, setSearchQuery] = useState('');
    const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);

    const displaySalespersons = useMemo(() => {
        if (!user) return [];

        if (salespersonId) {
            const found = salespersons.filter(s => s.id === salespersonId);
            return found.length > 0 ? found : [{ id: salespersonId, firstName: 'Sales', lastName: 'Agent' } as any];
        }

        if (['admin', 'manager', 'clinic_owner', 'SUPER_ADMIN'].includes(user.role)) {
            return salespersons.length > 0 ? salespersons : [user];
        }

        const myProfile = salespersons.filter(s => s.id === user.id);
        return myProfile.length > 0 ? myProfile : [user];
    }, [salespersons, user, salespersonId]);

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
        dispatch(fetchSalespersons());
        dispatch(fetchSalesActivities(selectedDate.toISOString()));
    }, [dispatch, selectedDate]);

    const navigateDate = (direction: 'prev' | 'next') => {
        if (viewMode === 'day') {
            setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
        } else if (viewMode === 'week') {
            setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
        }
    };

    const getActivitiesForSalesperson = (salespersonId: string, date: Date) => {
        return diaryActivities.filter(act =>
            act.salespersonId === salespersonId &&
            isSameDay(new Date(act.startTime), date)
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        });

        const myId = salespersonId || user?.id;

        return (
            <div className="diary-grid-container week-view">
                <div className="diary-time-column">
                    <div className="diary-header-cell spacer"></div>
                    {timeSlots.map(time => (
                        <div key={time} className="diary-time-cell">{time}</div>
                    ))}
                </div>
                <div className="diary-week-columns flex-1 flex overflow-x-auto custom-scrollbar">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={`diary-day-column flex-1 min-w-[180px] border-r border-gray-100 relative ${isToday(day) ? 'bg-blue-50/10' : ''}`}>
                            <div className={`diary-header-cell flex-col border-b border-gray-100 ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(day, 'EEE')}</span>
                                <span className={`text-lg font-black ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>{format(day, 'd')}</span>
                            </div>
                            <div className="diary-slots-container relative">
                                {timeSlots.map(time => (
                                    <div key={time} className="diary-slot-cell border-b border-gray-50 h-[60px]"></div>
                                ))}
                                {diaryActivities
                                    .filter(act => (myId ? act.salespersonId === myId : true) && isSameDay(new Date(act.startTime), day))
                                    .map(act => {
                                        const start = new Date(act.startTime);
                                        const end = new Date(act.endTime);
                                        const startMinutes = start.getHours() * 60 + start.getMinutes();
                                        const dayStartMinutes = 8 * 60;
                                        const top = ((startMinutes - dayStartMinutes) / 30) * 60;
                                        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                        const height = Math.max((duration / 30) * 60, 35);

                                        const getIcon = () => {
                                            if (act.actionType === 'call') return <Phone className="w-2.5 h-2.5" />;
                                            if (act.actionType === 'email') return <Mail className="w-2.5 h-2.5" />;
                                            return <MessageSquare className="w-2.5 h-2.5" />;
                                        };

                                        return (
                                            <div
                                                key={act.id}
                                                className={`activity-block compact type-${act.type} status-${act.status}`}
                                                style={{ top: `${top + 60}px`, height: `${height - 2}px` }}
                                            >
                                                <div className="text-[9px] font-black leading-tight text-gray-900 truncate flex items-center gap-1">
                                                    {getIcon()} {act.title}
                                                </div>
                                                <div className="text-[8px] font-bold text-gray-500 truncate">{act.customerName}</div>
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
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Unified Sticky Header for Staff */}
            <div className="sticky top-0 z-30 flex border-b border-slate-100 bg-white shadow-sm flex-none">
                <div className="w-[70px] bg-slate-50/50 border-r border-slate-100 flex-none flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex overflow-hidden flex-1">
                    <div className="flex" style={{ minWidth: "100%" }}>
                        {displaySalespersons.map(member => (
                            <div key={`header-${member.id}`} className="w-[200px] flex-none px-4 py-4 flex items-center gap-3 border-r border-slate-50">
                                <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                    {member.profilePictureUrl ? (
                                        <img src={member.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-4 h-4 text-slate-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-black text-slate-900 uppercase italic truncate tracking-tight">{member.firstName}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                        {member.role === 'SUPER_ADMIN' ? 'Commander' : member.role === 'manager' ? 'Ops Lead' : member.role === 'admin' ? 'Strategic Admin' : 'Agent'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable Body Container */}
            <div className="flex-1 overflow-auto custom-scrollbar flex bg-slate-50/20">
                {/* Time Scale Column */}
                <div className="w-[70px] flex-none border-r border-slate-100 bg-white/50 sticky left-0 z-20">
                    {timeSlots.map(time => (
                        <div key={time} className="h-[80px] flex items-start justify-center pt-2 text-[10px] font-black text-slate-400 tabular-nums border-b border-slate-50/50">
                            {time}
                        </div>
                    ))}
                </div>

                {/* Staff Columns Grid */}
                <div className="flex-1 flex min-w-max relative">
                    {displaySalespersons.map(member => (
                        <div key={member.id} className="w-[200px] flex-none border-r border-slate-100/50 relative bg-white/30">
                            {/* Visual Grid Slots */}
                            {timeSlots.map(time => (
                                <div 
                                    key={time} 
                                    className="h-[80px] border-b border-slate-50/60 hover:bg-[#CBFF38]/5 transition-colors cursor-crosshair group"
                                    onClick={() => console.log('Log at', time)}
                                >
                                    <Plus className="w-3 h-3 text-slate-200 opacity-0 group-hover:opacity-100 absolute m-2 transition-all" />
                                </div>
                            ))}

                            {/* Activities - Absolute Positioned Layer */}
                            {getActivitiesForSalesperson(member.id, selectedDate).map(act => {
                                const start = new Date(act.startTime);
                                const end = new Date(act.endTime);
                                const startMinutes = start.getHours() * 60 + start.getMinutes();
                                const dayStartMinutes = 8 * 60;
                                const top = ((startMinutes - dayStartMinutes) / 30) * 80;
                                const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                const height = Math.max((duration / 30) * 80, 50);

                                const getIcon = () => {
                                    if (act.type === 'appointment') return <CalendarIcon className="w-3 h-3" />;
                                    if (act.actionType === 'call') return <Phone className="w-3 h-3" />;
                                    if (act.actionType === 'email') return <Mail className="w-3 h-3" />;
                                    return <MessageSquare className="w-3 h-3" />;
                                };

                                return (
                                    <div
                                        key={act.id}
                                        className={`activity-block absolute left-2 right-2 rounded-2xl border-l-[6px] shadow-xl p-3 transition-all hover:scale-[1.03] hover:z-40 cursor-pointer group flex flex-col justify-between type-${act.type} status-${act.status}`}
                                        style={{ top: `${top + 4}px`, height: `${height - 8}px` }}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-start justify-between">
                                                <div className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter leading-none flex items-center gap-1.5 truncate">
                                                    {getIcon()}
                                                    {act.title}
                                                </div>
                                                {act.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-500 truncate">{act.customerName}</div>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{format(start, 'HH:mm')}</span>
                                            <div className="size-1.5 rounded-full bg-slate-300 group-hover:bg-[#CBFF38] animate-pulse" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Header - Matching GlobalCalendar style */}
            <div className="flex items-center justify-between flex-none">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <div>
                        <h2 className="text-xl font-bold">Staff Diary</h2>
                        <p className="text-xs text-slate-500">
                            Daily activities matrix for all sales agents and managers.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {(['day', 'week'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                                    viewMode === mode 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Date Navigation */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-3 text-sm font-semibold min-w-[140px] text-center">
                            {format(selectedDate, viewMode === 'day' ? "EEE, MMM d" : "MMM d")} 
                            {viewMode === 'week' && ` - ${format(addDays(selectedDate, 6), "MMM d, yyyy")}`}
                        </div>
                        <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={() => setIsBookingsModalOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Action
                    </Button>
                </div>
            </div>

            {/* Main Calendar Card */}
            <Card className="border-none shadow-lg flex-1 overflow-hidden flex flex-col bg-white">
                <CardContent className="p-0 flex-1 flex flex-col overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing...</span>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                        {viewMode === 'day' ? renderDayView() : renderWeekView()}
                    </div>
                </CardContent>
            </Card>

            <SalesBookingsModal
                isOpen={isBookingsModalOpen}
                onClose={() => setIsBookingsModalOpen(false)}
            />
        </div>
    );
};
