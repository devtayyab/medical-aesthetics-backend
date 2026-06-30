import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
 ChevronLeft, ChevronRight, Plus, Clock, User, Users, Scissors, CheckCircle2,
 XCircle, AlertCircle, Calendar, CreditCard, X, Search, MapPin, Phone, ArrowLeft,
 TrendingUp, Target, ListTodo, MoreVertical, RefreshCw, Move, Shield, Building2
} from 'lucide-react';
import {
 format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameDay,
 startOfDay, isToday, addWeeks, subWeeks, subDays, setHours, setMinutes, parseISO, startOfMonth, endOfMonth
} from 'date-fns';
import { AppDispatch, RootState } from '@/store';
import {
 fetchClinicAppointments,
 updateAppointmentStatus,
 completeAppointment,
} from '@/store/slices/bookingSlice';
import { fetchAvailability } from '@/store/slices/clinicSlice';
import { fetchLeads, fetchSalespersons, fetchClinics, fetchSuperAdminStats, reassignCustomer, scheduleRecurring } from '@/store/slices/crmSlice';
import { Button } from '@/components/atoms/Button/Button';
import { crmAPI, clinicsAPI, bookingAPI } from '@/services/api';
import toast from 'react-hot-toast';

const statusLabels: Record<string, { label: string, color: string, icon: any }> = {
 PENDING: { label: 'Booked', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
 CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
 ARRIVED: { label: 'Arrived', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: User },
 IN_PROGRESS: { label: 'Started', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Scissors },
 NO_SHOW: { label: 'No-show', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
 CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
 COMPLETED: { label: 'Done', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 },
};

export const AdminSuperCalendar: React.FC = () => {
 const dispatch = useDispatch<AppDispatch>();
 const navigate = useNavigate();
 
 // Redux State
 const { appointments } = useSelector((state: RootState) => state.booking);
 const { availability } = useSelector((state: RootState) => state.clinic);
 const { user } = useSelector((state: RootState) => state.auth);
 const { salespersons, clinics } = useSelector((state: RootState) => state.crm);

 // Local View State
 const [viewDate, setViewDate] = useState(new Date());
 const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
 const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
 const [selectedProviderId, setSelectedProviderId] = useState<string>('all');
 const [dashboardStats, setDashboardStats] = useState<any>(null);
 const [isStatsLoading, setIsStatsLoading] = useState(false);

 // Drawers & Modals
 const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
 const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
 const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
 
 const [selectedApt, setSelectedApt] = useState<any>(null);
 const [targetSalespersonId, setTargetSalespersonId] = useState('');
 
 // Recurring state
 const [recurringForm, setRecurringForm] = useState({
 frequency: 'weekly',
 startDate: format(new Date(), 'yyyy-MM-dd')
 });

 // Fetch Base Data
 useEffect(() => {
 dispatch(fetchClinics());
 dispatch(fetchSalespersons());
 refreshStats();
 }, [dispatch]);

 const refreshStats = async () => {
 setIsStatsLoading(true);
 try {
 const start = format(startOfMonth(viewDate), 'yyyy-MM-dd');
 const end = format(endOfMonth(viewDate), 'yyyy-MM-dd');
 const res = await dispatch(fetchSuperAdminStats({ startDate: start, endDate: end })).unwrap();
 setDashboardStats(res);
 } catch (err) {
 toast.error("Failed to fetch dashboard stats");
 } finally {
 setIsStatsLoading(false);
 }
 };

 const currentFilters = useMemo(() => {
 const filters: any = {};
 if (selectedProviderId !== 'all') filters.providerId = selectedProviderId;
 if (selectedClinicId !== 'all') filters.clinicId = selectedClinicId;
 
 if (viewMode === 'week') {
 filters.startDate = format(startOfWeek(viewDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
 filters.endDate = format(endOfWeek(viewDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
 } else {
 filters.date = format(viewDate, 'yyyy-MM-dd');
 }
 return filters;
 }, [selectedClinicId, selectedProviderId, viewDate, viewMode]);

 useEffect(() => {
 dispatch(fetchClinicAppointments(currentFilters));
 }, [dispatch, currentFilters, viewDate, selectedClinicId]);

 const weekDays = useMemo(() => {
 if (viewMode === 'day') return [startOfDay(viewDate)];
 return eachDayOfInterval({
 start: startOfWeek(viewDate, { weekStartsOn: 1 }),
 end: endOfWeek(viewDate, { weekStartsOn: 1 })
 });
 }, [viewDate, viewMode]);

 const hours = Array.from({ length: 24 }, (_, i) => i);

 const handleReassign = async () => {
 if (!selectedApt?.clientId || !targetSalespersonId) return;
 try {
 await dispatch(reassignCustomer({
 customerId: selectedApt.clientId,
 salespersonId: targetSalespersonId
 })).unwrap();
 toast.success("Customer reassigned successfully");
 setIsReassignModalOpen(false);
 dispatch(fetchClinicAppointments(currentFilters));
 } catch (err) {
 toast.error("Failed to reassign customer");
 }
 };

 const handleScheduleRecurring = async () => {
 if (!selectedApt) return;
 try {
 await dispatch(scheduleRecurring({
 customerId: selectedApt.clientId,
 clinicId: selectedApt.clinicId,
 serviceId: selectedApt.serviceId,
 frequency: recurringForm.frequency,
 startDate: recurringForm.startDate
 })).unwrap();
 toast.success("Recurring appointments scheduled");
 setIsRecurringModalOpen(false);
 } catch (err) {
 toast.error("Failed to schedule recurring appointments");
 }
 };

 return (
 <div className="flex h-full w-full bg-gray-50 relative overflow-hidden rounded-xl border border-gray-200 shadow-sm flex-col">
 
 {/* Super Admin KPI Header */}
 <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
 <div className="flex items-center gap-4">
 <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38] shadow-xl shadow-lime-500/20">
 <Shield className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
 Admin Control Center
 <span className="text-[8px] bg-[#CBFF38] text-black px-2 py-0.5 rounded-full font-black animate-pulse">COMMAND</span>
 </h1>
 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Global Platform Oversight</p>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-4xl">
 <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center gap-3">
 <div className="size-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
 <TrendingUp className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Turnover (MTD)</p>
 <p className="text-sm font-black text-emerald-700">€{dashboardStats?.turnover?.totalPaid?.toLocaleString() || 0}</p>
 </div>
 </div>
 <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center gap-3">
 <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
 <Calendar className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Appointments</p>
 <p className="text-sm font-black text-blue-700">{dashboardStats?.appointments?.total || 0}</p>
 </div>
 </div>
 <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center gap-3">
 <div className="size-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
 <Target className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Due Tasks</p>
 <p className="text-sm font-black text-orange-700">{dashboardStats?.tasks?.overdue || 0}</p>
 </div>
 </div>
 <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center gap-3">
 <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 <div>
 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Completed</p>
 <p className="text-sm font-black text-purple-700">{dashboardStats?.appointments?.completed || 0}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Controls Sub-header */}
 <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => setViewDate(d => viewMode === 'week' ? subWeeks(d, 1) : subDays(d, 1))}>
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <span className="text-[11px] font-black text-gray-700 min-w-[140px] text-center uppercase px-2">
 {viewMode === 'week'
 ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[weekDays.length - 1], 'MMM d')}`
 : format(viewDate, 'EEEE, MMM d')}
 </span>
 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={() => setViewDate(d => viewMode === 'week' ? addWeeks(d, 1) : addDays(d, 1))}>
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>

 <div className="flex items-center gap-3 flex-1 lg:flex-none">
 <div className="relative group min-w-[180px]">
 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
 <select
 value={selectedClinicId}
 onChange={(e) => setSelectedClinicId(e.target.value)}
 className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl pl-9 pr-8 py-2.5 text-[10px] font-black uppercase appearance-none focus:ring-2 focus:ring-black transition-all"
 >
 <option value="all">All Clinics</option>
 {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>

 <div className="relative group min-w-[180px]">
 <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
 <select
 value={selectedProviderId}
 onChange={(e) => setSelectedProviderId(e.target.value)}
 className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl pl-9 pr-8 py-2.5 text-[10px] font-black uppercase appearance-none focus:ring-2 focus:ring-black transition-all"
 >
 <option value="all">All Personnel</option>
 {salespersons.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
 </select>
 </div>

 <div className="flex gap-1 items-center bg-gray-100 p-1 rounded-xl ml-auto">
 <button onClick={() => setViewMode('day')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Day</button>
 <button onClick={() => setViewMode('week')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Week</button>
 </div>
 </div>
 </div>

 {/* Calendar Grid */}
 <div className="flex-1 overflow-auto flex bg-white relative no-scrollbar">
 <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 pt-12 sticky left-0 z-20">
 {hours.map(hour => (
 <div key={hour} className="h-16 flex items-start justify-center text-[10px] font-bold text-gray-400 -mt-2">
 {hour.toString().padStart(2, '0')}:00
 </div>
 ))}
 </div>

 <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} min-w-[1000px] relative`}>
 {weekDays.map(day => (
 <div key={day.toISOString()} className={`relative border-r border-gray-100 ${isToday(day) ? 'bg-[#CBFF38]/5' : ''}`}>
 <div className="h-12 border-b border-gray-100 flex flex-col items-center justify-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
 <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday(day) ? 'text-black' : 'text-gray-400'}`}>{format(day, 'EEEE')}</span>
 <span className={`text-base font-black ${isToday(day) ? 'text-black' : 'text-gray-900'}`}>{format(day, 'd')}</span>
 </div>
 <div className="relative h-[1536px]">
 {hours.map(hour => (
 <div key={hour} className="h-16 border-b border-gray-50/50 w-full relative" />
 ))}

 {appointments.filter(a => isSameDay(parseISO(a.startTime), day)).map(apt => {
 const start = parseISO(apt.startTime);
 const end = parseISO(apt.endTime);
 const top = start.getHours() * 64 + (start.getMinutes() / 60) * 64;
 const durationHours = (end.getTime() - start.getTime()) / 3600000;
 const height = Math.max(durationHours * 64, 45);
 const style = statusLabels[apt.status] || statusLabels.PENDING;

 return (
 <div
 key={apt.id}
 onClick={() => { setSelectedApt(apt); setIsDetailDrawerOpen(true); }}
 className={`absolute left-1 right-1 rounded-lg border p-2 shadow-sm cursor-pointer group hover:shadow-lg transition-all z-20 ${style.color}`}
 style={{ top, height }}
 >
 <div className="flex items-center gap-1.5 mb-1 overflow-hidden">
 <span className="text-[9px] font-black uppercase truncate">{apt.client?.firstName} {apt.client?.lastName}</span>
 </div>
 <div className="text-[8px] font-bold opacity-70 truncate uppercase">{apt.service?.name}</div>
 <div className="text-[7px] font-black mt-1 text-black/50 truncate uppercase">{apt.clinic?.name} | {apt.provider?.firstName}</div>
 </div>
 );
 })}

 {isToday(day) && (
 <div className="absolute left-0 right-0 border-t-2 border-black z-30 pointer-events-none" style={{ top: (new Date().getHours() * 64) + (new Date().getMinutes() / 60 * 64) }}>
 <div className="absolute -left-1 -top-1 size-2 bg-black rounded-full" />
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Sidebar Details Drawer */}
 {isDetailDrawerOpen && selectedApt && (
 <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-[100] border-l border-gray-100 flex flex-col transform transition-transform duration-300">
 <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-black text-[#CBFF38]">
 <div className="flex items-center gap-3">
 <Shield className="w-5 h-5" />
 <h2 className="text-lg font-black uppercase tracking-tighter">Command Detail</h2>
 </div>
 <button onClick={() => setIsDetailDrawerOpen(false)} className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
 <section>
 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Patient Intelligence</h3>
 <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
 <div className="flex items-center gap-4 mb-4">
 <div className="size-12 bg-black text-[#CBFF38] rounded-xl flex items-center justify-center text-lg font-black">
 {selectedApt.client?.firstName?.[0]}{selectedApt.client?.lastName?.[0]}
 </div>
 <div>
 <p className="text-base font-black text-gray-900">{selectedApt.client?.firstName} {selectedApt.client?.lastName}</p>
 <p className="text-xs text-gray-500 font-medium">{selectedApt.client?.phone || 'No Phone'}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-white p-3 rounded-xl border border-gray-100">
 <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Status</p>
 <div className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${statusLabels[selectedApt.status]?.color}`}>
 {selectedApt.status}
 </div>
 </div>
 <div className="bg-white p-3 rounded-xl border border-gray-100">
 <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Value</p>
 <p className="text-sm font-black text-emerald-700">€{selectedApt.service?.price || 0}</p>
 </div>
 </div>
 </div>
 </section>

 <section className="space-y-3">
 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Administrative Actions</h3>
 <Button 
 onClick={() => setIsReassignModalOpen(true)}
 className="w-full bg-black text-[#CBFF38] hover:bg-zinc-800 font-black uppercase py-6 rounded-xl flex items-center justify-center gap-3"
 >
 <Move className="w-5 h-5" /> Reassign Customer
 </Button>
 <Button 
 onClick={() => setIsRecurringModalOpen(true)}
 className="w-full bg-white text-black border border-gray-200 hover:bg-gray-50 font-black uppercase py-6 rounded-xl flex items-center justify-center gap-3"
 >
 <RefreshCw className="w-5 h-5" /> Set Recurring
 </Button>
 <Button 
 onClick={() => navigate(`/crm/customer/${selectedApt.clientId}`)}
 className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase py-6 rounded-xl flex items-center justify-center gap-3"
 >
 <Search className="w-5 h-5" /> View Full CRM
 </Button>
 </section>

 <section>
 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Dispatch Info</h3>
 <div className="space-y-3">
 <div className="flex items-center gap-3 text-sm">
 <MapPin className="w-4 h-4 text-gray-400" />
 <span className="font-bold text-gray-700">{selectedApt.clinic?.name}</span>
 </div>
 <div className="flex items-center gap-3 text-sm">
 <User className="w-4 h-4 text-gray-400" />
 <span className="font-bold text-gray-700">Assigned: {selectedApt.provider?.firstName}</span>
 </div>
 <div className="flex items-center gap-3 text-sm">
 <Clock className="w-4 h-4 text-gray-400" />
 <span className="font-bold text-gray-700">{format(parseISO(selectedApt.startTime), 'EEEE, MMM d @ HH:mm')}</span>
 </div>
 </div>
 </section>
 </div>
 </div>
 )}

 {/* Reassign Modal */}
 {isReassignModalOpen && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
 <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
 <div className="p-6 bg-black text-[#CBFF38] flex items-center justify-between">
 <h3 className="text-xl font-black uppercase">Reassign Customer</h3>
 <button onClick={() => setIsReassignModalOpen(false)}><X className="w-6 h-6" /></button>
 </div>
 <div className="p-8 space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Target Salesperson</label>
 <select 
 value={targetSalespersonId}
 onChange={(e) => setTargetSalespersonId(e.target.value)}
 className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-black uppercase"
 >
 <option value="">Choose Personnel...</option>
 {salespersons.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
 </select>
 </div>
 <div className="flex gap-4">
 <Button onClick={() => setIsReassignModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl">Cancel</Button>
 <Button onClick={handleReassign} className="flex-1 bg-black text-[#CBFF38] font-black uppercase py-4 rounded-xl">Confirm Transfer</Button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Recurring Modal */}
 {isRecurringModalOpen && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
 <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
 <div className="p-6 bg-black text-[#CBFF38] flex items-center justify-between">
 <h3 className="text-xl font-black uppercase">Schedule Recurring</h3>
 <button onClick={() => setIsRecurringModalOpen(false)}><X className="w-6 h-6" /></button>
 </div>
 <div className="p-8 space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequency</label>
 <select 
 value={recurringForm.frequency}
 onChange={(e) => setRecurringForm({...recurringForm, frequency: e.target.value})}
 className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-black uppercase"
 >
 <option value="daily">Daily</option>
 <option value="weekly">Weekly</option>
 <option value="monthly">Monthly</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</label>
 <input 
 type="date"
 value={recurringForm.startDate}
 onChange={(e) => setRecurringForm({...recurringForm, startDate: e.target.value})}
 className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-black"
 />
 </div>
 <div className="flex gap-4 pt-4">
 <Button onClick={() => setIsRecurringModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl">Cancel</Button>
 <Button onClick={handleScheduleRecurring} className="flex-1 bg-black text-[#CBFF38] font-black uppercase py-4 rounded-xl">Initialize Schedule</Button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
