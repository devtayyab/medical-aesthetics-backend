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
    Clock,
    X
} from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { fetchAppointments, fetchClinicProviders, fetchServices, fetchClinicProfile, updateAppointmentStatus } from '@/store/slices/clinicSlice';
import { AppointmentStatus } from '@/types/clinic.types';
import AppointmentExecutionModal from '@/components/clinic/AppointmentExecutionModal';
import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent } from '@/components/molecules/Card/Card';
import { CRMBookingModal } from '@/components/crm/CRMBookingModal';
import { crmAPI, bookingAPI } from '@/services/api';
import './StaffDiary.css';

interface StaffDiaryProps {
    clinicId?: string;
    onNewAppointment?: () => void;
}

export const StaffDiary: React.FC<StaffDiaryProps> = ({ clinicId, onNewAppointment }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { appointments, staff: allStaff, profile, services, isLoading } = useSelector((state: RootState) => state.clinic);
    const { user } = useSelector((state: RootState) => state.auth);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

    const filteredAppointments = useMemo(() => {
        let apts = appointments || [];
        if (user?.role === 'doctor') {
            apts = apts.filter(apt => apt.providerId === user.id);
        }
        return apts.filter(apt => apt.status !== 'CANCELLED');
    }, [appointments, user]);

    const staff = useMemo(() => {
        let baseStaff = [...allStaff];

        if (user?.role === 'doctor') {
            return baseStaff.filter(s => s.id === user.id);
        }

        const hasUnassignedOrUnknown = filteredAppointments.some(apt => {
            const matchesDay = isSameDay(new Date(apt.startTime), selectedDate);
            if (!matchesDay) return false;
            const isKnown = allStaff.some(s => s.id === apt.providerId);
            return !apt.providerId || !isKnown;
        });

        if (hasUnassignedOrUnknown) {
            const unassigned = {
                id: 'unassigned',
                fullName: 'Unassigned',
                role: 'No Provider',
                profilePictureUrl: null
            };
            return [unassigned, ...baseStaff];
        }

        return baseStaff;
    }, [allStaff, user, filteredAppointments, selectedDate]);

    const timeSlots = useMemo(() => {
        const slots = [];
        let current = setMinutes(setHours(new Date(), 8), 0);
        const end = setMinutes(setHours(new Date(), 23), 30);
        while (current <= end) {
            slots.push(format(current, 'HH:mm'));
            current = addMinutes(current, 30);
        }
        return slots;
    }, []);

    const resolvedClinicId = clinicId || profile?.id || (user as any)?.assignedClinics?.[0]?.id || (user as any)?.associatedClinicId || (user as any)?.clinicId || (user as any)?.ownedClinics?.[0]?.id || (user as any)?.ownedClinics?.[0];

    // Auto-fetch clinic profile if not yet loaded (needed to resolve clinicId)
    useEffect(() => {
        if (!profile) {
            dispatch(fetchClinicProfile());
        }
    }, [dispatch, profile]);

    useEffect(() => {
        if (resolvedClinicId) {
            dispatch(fetchClinicProviders(resolvedClinicId));
            dispatch(fetchServices(resolvedClinicId));
        }

        const filters: any = {};
        if (resolvedClinicId) filters.clinicId = resolvedClinicId;
        
        if (viewMode === 'day') {
            filters.date = format(selectedDate, 'yyyy-MM-dd');
        } else {
            filters.startDate = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            filters.endDate = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        }
        
        dispatch(fetchAppointments(filters));
    }, [dispatch, profile?.id, clinicId, selectedDate, user, viewMode, resolvedClinicId]);

    const navigateDate = (direction: 'prev' | 'next') => {
        if (viewMode === 'day') setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
        else setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    const getAppointmentsForProvider = (providerId: string, date: Date) => {
        return filteredAppointments.filter(apt => {
            const appointmentDate = new Date(apt.startTime);
            const matchesDay = isSameDay(appointmentDate, date);
            if (!matchesDay) return false;
            const isKnownProvider = allStaff.some(s => s.id === apt.providerId);
            if (providerId === 'unassigned') return !apt.providerId || !isKnownProvider;
            return apt.providerId === providerId;
        });
    };

    const openAptDetails = (apt: any) => {
        setSelectedApt(apt);
        setIsDetailDrawerOpen(true);
    };

    const renderDayView = () => {
        const dayApts = filteredAppointments.filter(apt =>
            isSameDay(new Date(apt.startTime), selectedDate)
        );

        return (
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <div className="flex flex-col relative h-full">
                    {/* Single header: Clinic name */}
                    <div className="sticky top-0 z-[50] flex border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                        <div className="w-[70px] bg-slate-50 border-r border-slate-100 flex-none flex items-center justify-center">
                            <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 p-4 flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-xl">
                                <CalendarIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black uppercase text-slate-900 leading-none">{profile?.name || 'Clinic'}</h3>
                                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{dayApts.length} appointment{dayApts.length !== 1 ? 's' : ''} today</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1">
                        {/* Time column */}
                        <div className="w-[70px] flex-none bg-white border-r border-slate-100 sticky left-0 z-40">
                            {timeSlots.map(time => (
                                <div key={time} className="h-[80px] flex items-start justify-center pt-2 text-[10px] font-black text-slate-400 tabular-nums">
                                    {time}
                                </div>
                            ))}
                        </div>

                        {/* Single appointments column */}
                        <div className="flex-1 relative bg-white/20">
                            {timeSlots.map(time => (
                                <div key={time} className="h-[80px] border-b border-slate-100/50 hover:bg-slate-50 transition-colors" />
                            ))}

                            {dayApts.map(apt => {
                                const start = new Date(apt.startTime);
                                const end = new Date(apt.endTime);
                                const top = ((start.getHours() * 60 + start.getMinutes() - 480) / 30) * 80;
                                const height = Math.max(((end.getTime() - start.getTime()) / 60000 / 30) * 80, 50);
                                const provider = staff.find(s => s.id === apt.providerId);

                                return (
                                    <div key={apt.id} onClick={() => openAptDetails(apt)}
                                        className={`absolute left-2 right-2 rounded-xl p-3 border-l-4 shadow-sm transition-all hover:scale-[1.01] hover:z-50 cursor-pointer flex flex-col justify-between status-${apt.status.toLowerCase()} bg-white shadow-slate-200/50`}
                                        style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase text-slate-900 truncate">{apt.clientDetails?.fullName || apt.client?.firstName || 'Patient'}</span>
                                            {provider && (
                                                <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md ml-1 whitespace-nowrap border border-indigo-100">
                                                    {provider.fullName?.split(' ')[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-[9px] font-bold text-slate-500 truncate lowercase">{apt.serviceName || 'Treatment'}</div>
                                            <div className="text-[8px] font-medium text-slate-400 truncate">{apt.clientDetails?.phone || apt.client?.phone || 'No Phone'}</div>
                                        </div>
                                        <div className="mt-auto flex justify-between items-center pt-1 border-t border-slate-50">
                                            <span className="text-[9px] font-black text-slate-400">{format(start, 'HH:mm')} – {format(end, 'HH:mm')}</span>
                                            {apt.bookedByInfo && <span className="text-[7px] font-black uppercase text-blue-400 bg-blue-50 px-1 rounded">By {apt.bookedByInfo.name.split(' ')[0]}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    const renderWeekView = () => {
        const weekDays = eachDayOfInterval({
            start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        });

        return (
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <div className="min-w-max flex flex-col relative h-full">
                    <div className="sticky top-0 z-[100] flex border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                        <div className="w-[70px] bg-slate-50 border-r border-slate-100 flex-none flex items-center justify-center sticky left-0 z-[110]">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        {weekDays.map(day => (
                            <div key={day.toISOString()} className="w-[160px] p-4 flex-none border-r border-slate-100 text-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{format(day, 'EEE')}</span>
                                <h3 className={`text-xl font-black mt-1 ${isToday(day) ? 'text-blue-600' : 'text-slate-900'}`}>{format(day, 'd')}</h3>
                                <p className="text-[8px] font-bold text-slate-300 mt-0.5">
                                    {filteredAppointments.filter(a => isSameDay(new Date(a.startTime), day)).length} apts
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-1">
                        <div className="w-[70px] flex-none bg-white border-r border-slate-100 sticky left-0 z-40">
                            {timeSlots.map(time => (
                                <div key={time} className="h-[80px] flex items-start justify-center pt-2 text-[10px] font-black text-slate-400 tabular-nums">
                                    {time}
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 flex relative">
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className={`w-[160px] flex-none border-r border-slate-100 relative ${isToday(day) ? 'bg-blue-50/20' : 'bg-white/20'}`}>
                                    {timeSlots.map(time => (
                                        <div key={time} className="h-[80px] border-b border-slate-100/50 hover:bg-slate-50 transition-colors" />
                                    ))}

                                    {filteredAppointments.filter(apt => isSameDay(new Date(apt.startTime), day)).map(apt => {
                                        const start = new Date(apt.startTime);
                                        const end = new Date(apt.endTime);
                                        const top = ((start.getHours() * 60 + start.getMinutes() - 480) / 30) * 80;
                                        const height = Math.max(((end.getTime() - start.getTime()) / 60000 / 30) * 80, 45);
                                        const provider = staff.find(s => s.id === apt.providerId);
                                        const clientName = apt.clientDetails?.fullName 
                                            || `${apt.client?.firstName || ''} ${apt.client?.lastName || ''}`.trim() 
                                            || 'Patient';

                                        return (
                                            <div key={apt.id} onClick={() => openAptDetails(apt)}
                                                className={`absolute left-1 right-1 rounded-xl p-2 border-l-4 shadow-sm transition-all hover:scale-[1.02] hover:z-50 cursor-pointer flex flex-col justify-between status-${apt.status.toLowerCase()} bg-white shadow-slate-200/50`}
                                                style={{ top: `${top + 2}px`, height: `${height - 4}px` }}
                                            >
                                                <div className="flex justify-between items-start gap-1">
                                                    <span className="text-[10px] font-black uppercase text-slate-900 truncate leading-none">{clientName}</span>
                                                </div>
                                                <div className="space-y-0.5 mt-0.5">
                                                    <div className="text-[9px] font-bold text-slate-500 truncate lowercase">{apt.serviceName || apt.service?.name || 'Treatment'}</div>
                                                    {provider && (
                                                        <div className="text-[8px] font-black text-indigo-500 truncate">{provider.fullName?.split(' ')[0]}</div>
                                                    )}
                                                </div>
                                                <div className="mt-auto pt-1 border-t border-slate-50">
                                                    <span className="text-[8px] font-black text-slate-400">{format(start, 'HH:mm')}–{format(end, 'HH:mm')}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="h-full flex flex-col overflow-hidden relative isolation-auto bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 flex-none px-6 py-4 border-b border-slate-100 bg-white z-[200] relative sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-xl">
                        <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase">{user?.role === 'doctor' ? 'Personal Matrix' : 'Clinic Schedule'}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{profile?.name || 'Authorized'} Terminal</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                        {(['day', 'week'] as const).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{mode}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 bg-white" onClick={() => navigateDate('prev')}><ChevronLeft size={16} /></Button>
                        <div className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-800 min-w-[140px] text-center italic shadow-sm">{format(selectedDate, "MMMM d, yyyy")}</div>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 bg-white" onClick={() => navigateDate('next')}><ChevronRight size={16} /></Button>
                    </div>
                    <Button onClick={() => setIsBookingModalOpen(true)} className="bg-slate-900 hover:bg-black text-white rounded-xl px-6 h-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 transition-all border-none">
                        <Plus className="w-4 h-4 mr-2" /> New Entry
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-[200] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {viewMode === 'day' ? renderDayView() : renderWeekView()}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 py-4 px-6 bg-slate-50/50 flex-none border-t border-slate-100">
                {[
                    { label: 'Pending', color: 'bg-blue-500' },
                    { label: 'Confirmed', color: 'bg-green-500' },
                    { label: 'Completed', color: 'bg-emerald-500' },
                    { label: 'Arrived', color: 'bg-amber-500' },
                    { label: 'No Show', color: 'bg-red-500' },
                ].map(status => (
                    <div key={status.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">{status.label}</span>
                    </div>
                ))}
            </div>

            {isDetailDrawerOpen && selectedApt && (
                <div className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col z-[2000] animate-in slide-in-from-right duration-300">
                    <div className="p-6 text-white bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <h2 className="text-xl font-black italic tracking-tighter">{selectedApt.clientDetails?.fullName || selectedApt.client?.firstName || 'Patient Detail'}</h2>
                            <button onClick={() => setIsDetailDrawerOpen(false)} className="text-white/40 hover:text-white bg-white/5 p-1.5 rounded-xl"><X size={18} /></button>
                        </div>
                        <div className="space-y-1.5 relative z-10">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{format(new Date(selectedApt.startTime), 'EEEE, MMM do, yyyy')}</p>
                            <p className="text-sm font-black italic tracking-tight">{format(new Date(selectedApt.startTime), 'HH:mm')} — {format(new Date(selectedApt.endTime), 'HH:mm')}</p>
                        </div>
                        <div className="mt-6 flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><UserIcon size={14} className="text-blue-400" /></div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase">Provider Assigned</p>
                                <p className="text-xs font-black text-white/90">{staff.find(s => s.id === selectedApt.providerId)?.fullName || 'Pending'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center group">
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Service Type</p>
                                    <p className="font-black text-slate-800 italic truncate">{selectedApt.serviceName || 'Medical Procedure'}</p>
                                </div>
                                <span className="text-xl font-black text-slate-900 ml-4 whitespace-nowrap">€{selectedApt.service?.price || '–'}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xl shadow-slate-200/50 space-y-5">
                                <div className="flex items-center gap-2.5 text-blue-600"><CalendarIcon size={16} /><span className="text-[11px] font-black uppercase tracking-widest italic">Operational Control</span></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase px-1">Matrix Date</label><input type="date" value={format(new Date(selectedApt.startTime), 'yyyy-MM-dd')} onChange={(e) => { const d = new Date(e.target.value); const old = new Date(selectedApt.startTime); d.setHours(old.getHours(), old.getMinutes()); setSelectedApt({ ...selectedApt, startTime: d.toISOString() }); }} className="w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none focus:bg-slate-100" /></div>
                                    <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase px-1">Start Hour</label><input type="time" value={format(new Date(selectedApt.startTime), 'HH:mm')} onChange={(e) => { const [h, m] = e.target.value.split(':').map(Number); const d = new Date(selectedApt.startTime); d.setHours(h, m); setSelectedApt({ ...selectedApt, startTime: d.toISOString() }); }} className="w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none focus:bg-slate-100" /></div>
                                </div>
                                <div className="space-y-1"><label className="text-[8px] font-black text-slate-400 uppercase px-1">Professional Lead</label><select className="w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none appearance-none" value={selectedApt.providerId || ''} onChange={(e) => setSelectedApt({ ...selectedApt, providerId: e.target.value })}><option value="">Select Professional</option>{staff.map((s: any) => (<option key={s.id} value={s.id}>{s.fullName}</option>))}</select></div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase px-1">Treatment Matrix</label>
                                    <select 
                                        className="w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none appearance-none" 
                                        value={selectedApt.serviceId || ''} 
                                        onChange={(e) => {
                                            const serviceId = e.target.value;
                                            const service = services?.find((s: any) => s.id === serviceId);
                                            setSelectedApt({ ...selectedApt, serviceId, serviceName: service?.name || service?.treatment?.name });
                                        }}
                                    >
                                        <option value="">Select Treatment</option>
                                        {services?.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name || s.treatment?.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedApt.status === 'COMPLETED' && (
                                    <div className="pt-4 space-y-4 border-t border-slate-100">
                                        {selectedApt.treatmentDetails?.actualServiceNames?.length > 1 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[8px] font-black text-slate-400 uppercase px-1">Procedures Performed</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedApt.treatmentDetails.actualServiceNames.map((name: string, i: number) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase italic border border-emerald-100">{name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {selectedApt.notes && (
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase px-1">Clinical Notes</p>
                                                <div className="p-3 bg-slate-50 rounded-xl text-[10px] font-medium text-slate-600 italic border border-slate-100">{selectedApt.notes}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all mt-4" onClick={async () => { try { await bookingAPI.updateAppointment(selectedApt.id, { startTime: selectedApt.startTime, providerId: selectedApt.providerId, serviceId: selectedApt.serviceId }); const targetClinicId = clinicId || profile?.id || (user as any)?.associatedClinicId || (user as any)?.clinicId || (user as any)?.ownedClinics?.[0]?.id || (user as any)?.ownedClinics?.[0]; const filters: any = {}; if (targetClinicId) filters.clinicId = targetClinicId; filters.date = format(selectedDate, 'yyyy-MM-dd'); dispatch(fetchAppointments(filters)); setIsDetailDrawerOpen(false); } catch (err) { alert("Matrix Sync Failed"); } }}>Update Matrix</Button>
                            </div>

                            {/* New Quick Actions Section */}
                            {selectedApt.status !== 'COMPLETED' && selectedApt.status !== 'CANCELLED' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2.5 text-slate-900"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[11px] font-black uppercase tracking-widest italic">Live Operations</span></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="h-11 rounded-2xl border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                                            onClick={() => dispatch(updateAppointmentStatus({ id: selectedApt.id, status: AppointmentStatus.ARRIVED }))}
                                        >
                                            Arrived
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="h-11 rounded-2xl border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100"
                                            onClick={() => dispatch(updateAppointmentStatus({ id: selectedApt.id, status: AppointmentStatus.NO_SHOW }))}
                                        >
                                            No Show
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="h-11 rounded-2xl border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                            onClick={() => {
                                                if (window.confirm("Cancel this appointment?")) {
                                                    dispatch(updateAppointmentStatus({ id: selectedApt.id, status: AppointmentStatus.CANCELLED }));
                                                    setIsDetailDrawerOpen(false);
                                                }
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            className="h-11 rounded-2xl bg-[#CBFF38] text-black hover:bg-black hover:text-[#CBFF38] text-[10px] font-black uppercase tracking-widest border-none"
                                            onClick={() => setIsExecutionModalOpen(true)}
                                        >
                                            Execute
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <CRMBookingModal 
                isOpen={isBookingModalOpen} 
                onClose={() => setIsBookingModalOpen(false)} 
                clinicId={resolvedClinicId}
                onSuccess={() => {
                    const filters: any = {};
                    if (resolvedClinicId) filters.clinicId = resolvedClinicId;
                    filters.date = format(selectedDate, 'yyyy-MM-dd');
                    dispatch(fetchAppointments(filters));
                }}
            />

            {isExecutionModalOpen && selectedApt && (
                <AppointmentExecutionModal
                    appointment={selectedApt}
                    onClose={() => setIsExecutionModalOpen(false)}
                    onComplete={() => {
                        setIsExecutionModalOpen(false);
                        setIsDetailDrawerOpen(false);
                        const targetClinicId = resolvedClinicId;
                        const filters: any = {};
                        if (targetClinicId) filters.clinicId = targetClinicId;
                        filters.date = format(selectedDate, 'yyyy-MM-dd');
                        dispatch(fetchAppointments(filters));
                    }}
                />
            )}
        </div>
    );
};
