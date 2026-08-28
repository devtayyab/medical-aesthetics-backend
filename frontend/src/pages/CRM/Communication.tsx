import React, { useEffect, useState, useMemo } from"react";
import { useNavigate } from"react-router-dom";
import { useDispatch, useSelector } from"react-redux";
import {
 MessageSquare, User, Clock, Phone, Mail, FileText, ExternalLink,
 Edit2, Search, Plus, ChevronDown, X, Sparkles, Calendar, List,
 CheckCircle, FilePlus, CalendarPlus, Info, Star, AlertCircle,
 ArrowRight, Video, Clipboard, MoreHorizontal, UserCheck, Bell
} from"lucide-react";
import { motion, AnimatePresence } from"framer-motion";
import { css } from"@emotion/css";
import toast from"react-hot-toast";

import { fetchCommunicationHistory } from"@/store/slices/crmSlice";
import { CommunicationForm } from"@/components/organisms/CommunicationForm/CommunicationForm";
import type { RootState, AppDispatch } from"@/store";
import type { CommunicationLog } from"@/types";
import { userAPI, crmAPI, notificationsAPI } from"@/services/api";





const badgeStyle = (type: string) => {
 const colors: Record<string, string> = {
 call: 'bg-green-100 text-green-700',
 email: 'bg-purple-100 text-purple-700',
 message: 'bg-blue-100 text-blue-700',
 completed: 'bg-lime-100 text-lime-700',
 pending: 'bg-yellow-100 text-yellow-700',
 task: 'bg-yellow-400/10 text-yellow-400',
 appointment: 'bg-[#CBFF38]/10 text-[#CBFF38]'
 };
 return `px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${colors[type] || 'bg-gray-100 text-gray-500'}`;
};

export const Communication: React.FC = () => {
 const dispatch = useDispatch<AppDispatch>();
 const navigate = useNavigate();
 const { communications = [], isLoading } = useSelector((state: RootState) => state.crm || {} as any);
 const { user } = useSelector((state: RootState) => state.auth);
 
 // UI States
 const [selectedTab, setSelectedTab] = useState('All');
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
 const [customers, setCustomers] = useState<any[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [editingLog, setEditingLog] = useState<CommunicationLog | null>(null);
 
 // Additional Data States
 const [tasks, setTasks] = useState<any[]>([]);
 const [appointments, setAppointments] = useState<any[]>([]);

 const [showPushModal, setShowPushModal] = useState(false);
 const [pushData, setPushData] = useState({ title: '', message: '' });
 const [isPushing, setIsPushing] = useState(false);

 // Fetch logic for contacts (initial or search)
 const fetchContacts = async (search?: string) => {
 setIsSearching(true);
 try {
 const isSuperAdmin = user?.role === 'SUPER_ADMIN';
 const isSalesperson = user?.role === 'salesperson';
 
 const usersParams: any = { role: 'client', search: search, limit: 20 };
 const leadsParams: any = search ? { search } : {};

 if (isSalesperson && !isSuperAdmin) {
 usersParams.salespersonId = user?.id;
 leadsParams.assignedSalesId = user?.id;
 }

 const [usersRes, leadsRes] = await Promise.all([
 userAPI.getAllUsers(usersParams),
 crmAPI.getLeads(leadsParams)
 ]);

 const users = (usersRes.data?.users || usersRes.data || []) as any[];
 const leads = (leadsRes.data?.leads || leadsRes.data || []) as any[];

 const results = [
 ...users.map(u => ({ ...u, typeLabel: 'Customer' })),
 ...leads.map(l => ({ ...l, typeLabel: 'Lead' }))
 ].map(item => ({
 id: item.id,
 name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Internal ID: ' + item.id.slice(0, 5),
 email: item.email || '',
 phone: item.phone || '',
 type: item.typeLabel || (item.role ? 'Customer' : 'Lead'),
 avatar: (item.firstName?.[0] || 'U') + (item.lastName?.[0] || '')
 }));

 setCustomers(results);
 
 // Auto-select first result if nothing is selected or if search changed
 if (results.length > 0 && (!selectedCustomerId || search)) {
 setSelectedCustomerId(results[0].id);
 }
 } catch (err) {
 console.error("Failed to fetch contacts:", err);
 } finally {
 setIsSearching(false);
 }
 };

 // Initial Fetch
 useEffect(() => {
 fetchContacts();
 }, []);

 // Search contacts logic with debouncing
 useEffect(() => {
 if (!searchQuery.trim()) {
 if (searchQuery ==="") fetchContacts(); // Revert to default list when cleared
 return;
 }

 const debounce = setTimeout(() => {
 fetchContacts(searchQuery);
 }, 500);
 
 return () => clearTimeout(debounce);
 }, [searchQuery]);

 // Fetch unified history whenever selection changes
 useEffect(() => {
 if (selectedCustomerId) {
 dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
 
 // Fetch Tasks & Appointments independently for full coverage
 (async () => {
 try {
 const [tasksRes, apptsRes] = await Promise.all([
 crmAPI.getActions(undefined, { customerId: selectedCustomerId }).catch(() => ({ data: [] })),
 crmAPI.getCustomerRecord(selectedCustomerId).then(res => res.data?.appointments || []).catch(() => [])
 ]);
 setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
 setAppointments(apptsRes);
 } catch (e) {
 console.error("Timeline data fetch failed:", e);
 }
 })();
 }
 }, [dispatch, selectedCustomerId]);

 const activeContact = useMemo(() => 
 customers.find(c => c.id === selectedCustomerId) || customers[0]
 , [selectedCustomerId, customers]);

 // UNIFIED TIMELINE LOGIC
 const unifiedTimeline = useMemo(() => {
 const comms = communications.map(c => ({ ...c, entryType: 'communication', date: c.createdAt }));
 const tks = tasks.map(t => ({ ...t, entryType: 'task', date: t.dueDate || t.createdAt }));
 const appts = appointments.map(a => ({ ...a, entryType: 'appointment', date: a.startTime }));

 const all = [...comms, ...tks, ...appts].sort((a, b) => 
 new Date(b.date).getTime() - new Date(a.date).getTime()
 );

 if (selectedTab === 'All') return all;
 if (selectedTab === 'Bookings') return all.filter(item => item.entryType === 'appointment');
 if (selectedTab === 'Tasks') return all.filter(item => item.entryType === 'task');
 return all.filter(item => item.type?.toLowerCase() === selectedTab.toLowerCase());
 }, [communications, tasks, appointments, selectedTab]);

 const handleConvertLead = async () => {
 if (!activeContact || activeContact.type !== 'Lead') return;
 if (!window.confirm("Convert this lead to a Customer? This will create a permanent node in the registry.")) return;

 try {
 await crmAPI.updateLead(activeContact.id, { status: 'converted' });
 alert("Lead successfully converted to Customer.");
 await fetchContacts(); // Refresh list to see them as Customer
 } catch (err) {
 console.error("Conversion failed:", err);
 toast.error("Failed to convert lead. Please check network logs.");
 }
 };

 const handleSendPush = async () => {
 if (!activeContact || !pushData.title || !pushData.message) return;
 setIsPushing(true);
 try {
 await notificationsAPI.sendNotification({
 recipientId: activeContact.id,
 type: 'push',
 title: pushData.title,
 message: pushData.message
 });
 alert("Notification dispatched successfully.");
 setShowPushModal(false);
 setPushData({ title: '', message: '' });
 } catch (err) {
 console.error("Push failed:", err);
 toast.error("Failed to deliver notification. Check console.");
 } finally {
 setIsPushing(false);
 }
 };

 const handleFormSuccess = () => {
 setShowForm(false);
 setEditingLog(null);
 if (selectedCustomerId) {
 dispatch(fetchCommunicationHistory({ customerId: selectedCustomerId }));
 }
 };

 return (
 <div className="bg-gray-50 min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 text-gray-900">
 <div className="max-w-[1400px] mx-auto">
 {/* Header Section Compact */}
 <div className="mb-6">
 <h1 className="text-2xl font-black uppercase tracking-tighter mb-1 flex items-center gap-2">
 Communication <span className="text-gray-900">History</span>
 </h1>
 <p className="text-gray-500 font-medium text-xs">Track and manage all customer interactions and tasks.</p>
 </div>

 <div className="flex flex-col xl:flex-row gap-6">
 {/* 1. Sidebar Panel Compact (Registry) */}
 <div className="w-full xl:w-[300px] flex flex-col xl:h-[calc(100vh-180px)]">
 <div className="relative mb-4 group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
 <input 
 type="text" 
 placeholder="Search contacts..."
 className="w-full h-11 bg-white rounded-xl pl-12 pr-4 text-xs font-medium border border-gray-200 focus:border-emerald-500 transition-all outline-none"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 {isSearching && (
 <div className="absolute right-4 top-1/2 -translate-y-1/2">
 <div className="animate-spin h-3 w-3 border-b-2 border-emerald-500 rounded-full"></div>
 </div>
 )}
 </div>

 <div className="flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[300px] xl:max-h-none">
 <div className="flex justify-between items-center mb-3">
 <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Contacts</span>
 <span className="text-[8px] font-black uppercase text-emerald-600">{customers.length} People</span>
 </div>

 {customers.map(contact => (
 <div 
 key={contact.id}
 className={`p-4 mb-2 rounded-2xl cursor-pointer transition-all border ${selectedCustomerId === contact.id ? 'bg-white border-gray-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-100/50'}`}
 onClick={() => setSelectedCustomerId(contact.id)}
 >
 <div className="flex items-center gap-3">
 <div className={`size-10 rounded-xl flex items-center justify-center font-black text-sm ${selectedCustomerId === contact.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
 {contact.avatar}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-center mb-0.5">
 <h3 className="font-black uppercase text-xs tracking-tight truncate text-gray-900">{contact.name}</h3>
 <span className={`text-[6px] font-black uppercase px-1 rounded ${contact.type === 'Lead' ? 'bg-amber-400/10 text-amber-600' : 'bg-blue-400/10 text-blue-600'}`}>
 {contact.type[0]}
 </span>
 </div>
 <p className={`text-[10px] ${selectedCustomerId === contact.id ? 'text-gray-500' : 'text-gray-400'} truncate font-bold`}>{contact.email || contact.phone || 'ID: '+contact.id.slice(0,6)}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* 2. Main Content & Context Panel Area */}
 <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
 <div className="flex-1 flex flex-col h-[calc(100vh-180px)] min-w-0">
 <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
 {['All', 'Call', 'Email', 'Bookings', 'Tasks'].map(tab => (
 <button 
 key={tab}
 onClick={() => setSelectedTab(tab)}
 className={`px-5 h-9 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${selectedTab === tab ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
 >
 {tab}
 </button>
 ))}
 </div>

 <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
 {isLoading ? (
 <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
 ) : unifiedTimeline.length > 0 ? (
 <div className="space-y-6">
 {unifiedTimeline.map((item: any) => {
 const isComm = item.entryType === 'communication';
 const isTask = item.entryType === 'task';
 const isAppt = item.entryType === 'appointment';
 
 let icon = <MessageSquare size={14} />;
 let title = item.subject || item.type || 'Interaction';
 let badge = badgeStyle(item.type || item.entryType);

 if (isTask) {
 icon = <List size={14} />;
 title = item.title || 'Operational Task';
 badge = 'bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded text-[7px] font-black uppercase ';
 } else if (isAppt) {
 icon = <Calendar size={14} />;
 title = item.service?.name || 'Medical Booking';
 badge = 'bg-[#CBFF38]/10 text-[#CBFF38] px-1.5 py-0.5 rounded text-[7px] font-black uppercase ';
 }

 return (
 <div key={item.id} className="relative pl-6 border-l border-white/10 group">
 <div className={`absolute -left-[4.5px] top-2 size-2 rounded-full bg-white border border-gray-300 group-hover:border-gray-900 transition-colors ${isAppt ? 'border-emerald-500' : ''}`} />
 <div className="flex justify-between items-center mb-1">
 <div className="flex items-center gap-2">
 <div className="text-gray-400">{icon}</div>
 <span className={badge}>{item.type || item.entryType}</span>
 <span className="text-[8px] font-bold text-gray-400 uppercase">{new Date(item.date).toLocaleDateString()}</span>
 </div>
 {isComm && (
 <button 
 onClick={() => { setEditingLog(item); setShowForm(true); }}
 className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-900 transition-all"
 >
 <Edit2 size={12}/>
 </button>
 )}
 </div>
 <h4 className="text-sm font-black uppercase tracking-tight mb-1">{title}</h4>
 <p className="text-gray-600 text-[10px] leading-relaxed font-bold">
 {isAppt ? `Clinic: ${item.clinic?.name || 'Main'} • Status: ${item.status}` : (item.notes || item.description || 'No description provided.')}
 </p>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-gray-400">
 <Clock size={32} className="mb-2" />
 <p className="text-[10px] font-black uppercase tracking-widest">No communication history found</p>
 </div>
 )}
 </div>
 </div>

 {/* 3. Small Context Panel */}
 {activeContact && (
 <aside className="w-full md:w-[300px] h-[calc(100vh-180px)] overflow-y-auto no-scrollbar space-y-6">
 <section className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
 <div className="flex flex-col items-center text-center mb-6">
 <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-900 text-xl font-black mb-4">
 {activeContact.avatar}
 </div>
 <h2 className="text-lg font-black uppercase tracking-tight mb-1 text-gray-900 truncate w-full">{activeContact.name}</h2>
 <p className="text-[10px] font-bold text-gray-500 uppercase">{activeContact.type}</p>
 </div>

 <div className="flex flex-col gap-2 mb-6">
 <button 
 onClick={() => setShowPushModal(true)}
 className="w-full h-11 bg-white rounded-xl flex items-center justify-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all font-black uppercase text-[10px] tracking-widest border border-gray-200"
 >
 <Bell size={14} /> SEND PUSH NOTIFICATION
 </button>
 <button 
 onClick={() => navigate(activeContact.type === 'Customer' ? `/crm/customer/${activeContact.id}` : `/crm/leads`)}
 className="w-full h-11 bg-white rounded-xl flex items-center justify-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all font-black uppercase text-[10px] tracking-widest border border-gray-200"
 >
 <ExternalLink size={14} /> VIEW FULL PROFILE
 </button>
 </div>

 <div className="space-y-3 border-t border-gray-100 pt-6">
 <div className="space-y-3">
 {activeContact.type === 'Lead' && (
 <button 
 onClick={handleConvertLead}
 className="w-full h-10 mb-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
 >
 <UserCheck size={14} /> CONVERT TO CUSTOMER
 </button>
 )}
 <div className="flex justify-between items-center">
 <span className="text-[8px] font-bold text-gray-500 uppercase">Email</span>
 <span className="text-[9px] font-black truncate max-w-[140px] text-gray-900">{activeContact.email || 'Closed'}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[8px] font-bold text-gray-500 uppercase">Interactions</span>
 <span className="text-[9px] font-black text-gray-900">{communications.length} total</span>
 </div>
 </div>
 
 <div className="pt-2">
 <div className="flex justify-between items-center mb-2">
 <h4 className="text-[8px] font-black uppercase tracking-widest text-gray-900">Next Action</h4>
 <Clock size={10} className="text-gray-400" />
 </div>
 <div className="p-3 bg-gray-50 rounded-xl text-[9px] font-bold text-gray-500">No scheduled actions</div>
 </div>
 </div>

 <button 
 onClick={() => { setEditingLog(null); setShowForm(true); }}
 className="w-full h-12 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-6 hover:scale-[1.02] transition-all shadow-md"
 >
 <Plus size={14}/> ADD COMMUNICATION
 </button>
 </section>
 </aside>
 )}
 </div>
 </div>
 </div>

 <AnimatePresence>
 {showPushModal && (
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.9 }} animate={{ scale: 1 }}
 className="bg-white rounded-[40px] border border-gray-200 p-6 sm:p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
 >
 <button onClick={() => setShowPushModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X/></button>
 <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-gray-900">Send Push Notification</h2>
 
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Title</label>
 <input 
 className="w-full h-14 bg-white rounded-2xl border border-gray-200 px-6 text-gray-900 text-sm focus:border-gray-900 shadow-sm outline-none transition-all"
 placeholder="E.g., Treatment Reminder"
 value={pushData.title}
 onChange={e => setPushData(prev => ({ ...prev, title: e.target.value }))}
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Message</label>
 <textarea 
 className="w-full h-32 bg-white rounded-2xl border border-gray-200 p-6 text-gray-900 text-sm focus:border-gray-900 shadow-sm outline-none transition-all resize-none"
 placeholder="Type your notification here..."
 value={pushData.message}
 onChange={e => setPushData(prev => ({ ...prev, message: e.target.value }))}
 />
 </div>
 <button 
 onClick={handleSendPush}
 disabled={isPushing}
 className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest mt-4 hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
 >
 {isPushing ? 'Dispatching...' : 'SEND NOTIFICATION'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}

 {showForm && (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 className="bg-white rounded-[40px] border border-gray-200 p-6 sm:p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
 >
 <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"><X/></button>
 <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-gray-900">
 {editingLog ? 'Edit' : 'Add'} Communication
 </h2>
 <CommunicationForm 
 customerId={selectedCustomerId}
 initialData={editingLog || undefined}
 onSuccess={handleFormSuccess}
 onCancel={() => setShowForm(false)}
 />
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};
