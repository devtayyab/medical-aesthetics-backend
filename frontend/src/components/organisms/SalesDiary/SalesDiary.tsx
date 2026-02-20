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
    CheckCircle2
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchSalespersons, fetchSalesActivities } from '@/store/slices/crmSlice';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import './SalesDiary.css';

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

    const displaySalespersons = useMemo(() => {
        if (!user) return [];

        if (salespersonId) {
            return salespersons.filter(s => s.id === salespersonId);
        }

        if (['admin', 'manager', 'clinic_owner', 'SUPER_ADMIN'].includes(user.role)) {
            return salespersons;
        }
        return salespersons.filter(s => s.id === user.id);
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
                <div className="diary-staff-scroll-wrapper" style={{ width: `${Math.max(displaySalespersons.length * 200, 800)}px` }}>
                    {displaySalespersons.map(member => (
                        <div key={member.id} className="diary-staff-column">
                            <div className="diary-header-cell staff-info">
                                <div className="staff-avatar">
                                    {member.profilePictureUrl ? (
                                        <img src={member.profilePictureUrl} alt={`${member.firstName} ${member.lastName}`} />
                                    ) : (
                                        <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-blue-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="staff-meta">
                                    <span className="staff-name">{member.firstName} {member.lastName}</span>
                                    <span className="staff-role">Sales Agent</span>
                                </div>
                            </div>
                            <div className="diary-slots-container">
                                {timeSlots.map(time => (
                                    <div key={time} className="diary-slot-cell" onClick={() => console.log('Log activity at', time, 'for', member.firstName)}></div>
                                ))}
                                {getActivitiesForSalesperson(member.id, selectedDate).map(act => {
                                    const start = new Date(act.startTime);
                                    const end = new Date(act.endTime);
                                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                                    const dayStartMinutes = 8 * 60;
                                    const top = ((startMinutes - dayStartMinutes) / 30) * 60; // 60px per 30 mins
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
                                    const height = Math.max((duration / 30) * 60, 40);

                                    const getIcon = () => {
                                        if (act.actionType === 'phone_call') return <Phone className="w-3 h-3" />;
                                        if (act.actionType === 'email') return <Mail className="w-3 h-3" />;
                                        return <MessageSquare className="w-3 h-3" />;
                                    };

                                    return (
                                        <div
                                            key={act.id}
                                            className={`activity-block type-${act.type} status-${act.status}`}
                                            style={{ top: `${top + 60}px`, height: `${height - 4}px` }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="act-info">
                                                    <span className="act-title flex items-center gap-1">
                                                        {getIcon()}
                                                        {act.title}
                                                    </span>
                                                    <span className="act-customer">{act.customerName}</span>
                                                </div>
                                                {act.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                            </div>
                                            <div className="act-time">{format(start, 'HH:mm')}</div>
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
        <div className="staff-diary-root sales-diary-root">
            {/* Toolbar */}
            <div className="diary-toolbar">
                <div className="toolbar-left">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sales Diary</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Lead & Activity Tracking</p>
                    </div>
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
                        {(['day', 'week'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                    <div className="search-box relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find activity..."
                            className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" /> Log Activity
                    </Button>
                </div>
            </div>

            {/* Main Calendar Area */}
            <div className="diary-content-area relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Syncing Activities...</span>
                        </div>
                    </div>
                )}
                <Card className="diary-card border-none shadow-2xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-0 h-full">
                        {renderDayView()}
                    </CardContent>
                </Card>
            </div>

            {/* Status Footer */}
            <div className="diary-footer mt-6 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" /> Pending Action
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Completed
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" /> Follow-up
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" /> Missed
                </div>
            </div>
        </div>
    );
};
