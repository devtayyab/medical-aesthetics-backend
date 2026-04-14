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
    Calendar as CalendarIcon
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
                            <div className="diary-header-cell staff-info border-b border-gray-100">
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
                                    <span className="staff-role">
                                        {member.role === 'doctor' ? 'Doctor' : 
                                         member.role === 'manager' ? 'Manager' : 
                                         member.role === 'admin' ? 'Administrator' : 
                                         member.role === 'SUPER_ADMIN' ? 'System Admin' : 
                                         member.role === 'clinic_owner' ? 'Owner' : 'Sales Agent'}
                                    </span>
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
                                        if (act.type === 'appointment') return <CalendarIcon className="w-3 h-3" />;
                                        if (act.actionType === 'call') return <Phone className="w-3 h-3" />;
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
    <div className="flex flex-col h-full bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 relative">
      {/* 1. Specialized High-Fidelity Toolbar */}
      <div className="px-8 py-6 border-b border-slate-50 bg-white sticky top-0 z-40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Sales Diary</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#CBFF38]"></span>
                Activity Matrix
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
              <button 
                onClick={() => navigateDate('prev')} 
                className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm hover:shadow-slate-200/50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 text-center min-w-[170px]">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">
                  {format(selectedDate, 'EEEE, MMM do')}
                </span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter -mt-0.5">{format(selectedDate, 'yyyy')}</p>
              </div>
              <button 
                onClick={() => navigateDate('next')} 
                className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm hover:shadow-slate-200/50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
              {(['day', 'week'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === mode 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="relative group flex-1 min-w-[240px] sm:flex-none">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-[#CBFF38] transition-all duration-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Search matrix missions..."
                className="w-full sm:w-80 pl-14 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-[12px] font-black placeholder:text-slate-300 focus:bg-white focus:ring-[6px] focus:ring-[#CBFF38]/10 transition-all outline-none shadow-sm cursor-text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsBookingsModalOpen(true)}
                variant="outline"
                className="h-11 px-5 border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-slate-50 transition-all"
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" /> Bookings
              </Button>
              <Button className="h-11 px-6 bg-[#CBFF38] text-black font-black uppercase tracking-widest text-[9px] rounded-2xl shadow-xl shadow-[#CBFF38]/20 hover:bg-[#b3d81b] hover:scale-[1.03] active:scale-[0.97] transition-all border-none">
                <Plus className="w-4 h-4 mr-2" /> Log Activity
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main High-Contrast Content Area */}
      <div className="flex-1 overflow-hidden relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-md flex items-center justify-center transition-all duration-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-900 border-t-[#CBFF38] rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 italic">Synchronizing Matrix</span>
            </div>
          </div>
        )}

        <div className="h-full overflow-hidden flex flex-col">
          {viewMode === 'day' ? renderDayView() : renderWeekView()}
        </div>
      </div>

      {/* 3. Specialized Status Ledger */}
      <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30 flex flex-wrap items-center justify-center gap-8">
        {[
          { label: 'Pending Action', color: 'bg-blue-500 shadow-blue-500/30' },
          { label: 'Deployed/Success', color: 'bg-emerald-500 shadow-emerald-500/30' },
          { label: 'Follow-up Required', color: 'bg-amber-500 shadow-amber-500/30' },
          { label: 'Mission Missed', color: 'bg-red-500 shadow-red-500/30' }
        ].map(status => (
          <div key={status.label} className="flex items-center gap-2.5 group cursor-default">
            <div className={`w-2.5 h-2.5 rounded-full ${status.color} shadow-lg transition-transform group-hover:scale-125 duration-300`} />
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 group-hover:text-slate-900 transition-colors duration-300 italic">{status.label}</span>
          </div>
        ))}
      </div>

      <SalesBookingsModal
        isOpen={isBookingsModalOpen}
        onClose={() => setIsBookingsModalOpen(false)}
      />
    </div>
  );
};
