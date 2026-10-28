import React, { useEffect, useState } from"react";
import { useDispatch, useSelector } from"react-redux";
import { useNavigate } from"react-router-dom";
import { RootState, AppDispatch } from"@/store";
import {
 Users,
 UserPlus,
 Mail,
 Phone,
 Shield,
 Search,
 X,
 CheckCircle2,
 AlertCircle,
 Trash2
} from"lucide-react";

import clinicApi from"@/services/api/clinicApi";

interface StaffMember {
 id: string;
 firstName: string;
 lastName: string;
 email: string;
 role: string;
 phone?: string;
 isActive: boolean;
 profile?: { staffRequest?: { status?: string } } | null;
}

const StaffPage: React.FC = () => {
 const navigate = useNavigate();
 const { profile } = useSelector((state: RootState) => state.clinic);
 const { user } = useSelector((state: RootState) => state.auth);
 const effectiveClinicId = profile?.id || user?.assignedClinicId || user?.ownedClinics?.[0]?.id || user?.assignedClinics?.[0]?.id || '';
 const [staff, setStaff] = useState<StaffMember[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [showAddModal, setShowAddModal] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");

  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    const interval = setInterval(handleLang, 1000);
    return () => {
      window.removeEventListener('storage', handleLang);
      clearInterval(interval);
    };
  }, []);


 // New Staff State
 // "Add staff" is a request the admin approves (item 26); no password here: the new
 // person sets their own through the email they get after approval.
 const emptyStaff = { firstName:"", lastName:"", email:"", role:"doctor", phone:"" };
 const [newStaff, setNewStaff] = useState(emptyStaff);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

 const fetchStaff = async () => {
 setIsLoading(true);
 try {
 const data = await clinicApi.staff.getAll(effectiveClinicId);
 setStaff(data);
 } catch (error) {
 console.error("Failed to fetch staff:", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchStaff();
 }, [effectiveClinicId]);

 const handleAddStaff = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 setMsg(null);
 try {
 await clinicApi.staff.create({
   ...newStaff,
   clinicId: effectiveClinicId,
 });
 setMsg({ type: 'success', text: isGreek ? "Το αίτημα στάλθηκε. Ο διαχειριστής θα το εγκρίνει και το νέο μέλος θα λάβει email για να ορίσει κωδικό." : "Request sent. The admin will approve it and the new member gets an email to set a password." });
 setShowAddModal(false);
 setNewStaff(emptyStaff);
 fetchStaff();
 } catch (error: any) {
 setMsg({ type: 'error', text: error.response?.data?.message || "Failed to create staff member" });
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleRemoveStaff = async (id: string) => {
 const confirmMsg = isGreek
   ? "Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτό το μέλος από το προσωπικό της κλινικής;"
   : "Are you sure you want to remove this staff member from this clinic?";
 if (!window.confirm(confirmMsg)) return;
 try {
 await clinicApi.staff.remove(id);
 setMsg({ type: 'success', text: isGreek ? "Το μέλος προσωπικού αφαιρέθηκε επιτυχώς!" : "Staff member removed successfully!" });
 fetchStaff();
 } catch (error: any) {
 setMsg({ type: 'error', text: error.response?.data?.message || (isGreek ? "Αποτυχία αφαίρεσης προσωπικού" : "Failed to remove staff") });
 }
 };

 const filteredStaff = staff.filter(s =>
 `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
 s.email.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="min-h-screen bg-[#F8FAFC]">
 {/* Minimal Header */}
 <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
 <div className="max-w-7xl mx-auto relative z-10">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
 <div className="space-y-3">
 <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
 <div className="size-1.5 rounded-full bg-blue-500" />
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Operational Force</span>
 </div>
 <div className="space-y-1">
 <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-gray-900">{isGreek ? "Κατάλογος προσωπικού" : "Staff Directory"}</h1>
 <p className="text-gray-500 font-medium max-w-md text-sm">{isGreek ? "Διαχειριστείτε το προσωπικό της κλινικής σας." : "Manage your clinic's staff."}</p>
 </div>
 </div>
 
 <div className="flex items-center gap-4">
 <button
 onClick={() => setShowAddModal(true)}
 className="h-12 px-6 bg-[#CBFF38] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-[#CBFF38] transition-all shadow-lg shadow-lime-500/10 flex items-center gap-3"
 >
 <UserPlus size={16} />
 {isGreek ? "Προσθήκη μέλους προσωπικού" : "Add Staff Member"}
  </button>
 </div>
 </div>
 </div>
 </div>

 {/* Search & Stats Bar */}
 <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 space-y-8 pb-20">
 <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
 <input
 type="text"
 placeholder="Identify personnel by name, email or designation..."
 className="w-full h-11 pl-12 pr-6 bg-gray-50 border-none rounded-xl focus:bg-white focus:ring-1 focus:ring-black transition-all font-bold text-xs placeholder:text-gray-300"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <div className="flex gap-2">
 <div className="h-11 px-5 bg-gray-50 rounded-xl flex items-center gap-3 border border-gray-50">
 <Users size={14} className="text-gray-400" />
 <span className="text-[10px] font-black uppercase tracking-tighter">{filteredStaff.length} TOTAL</span>
 </div>
 </div>
 </div>

 {msg && (
 <div className={`p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
 msg.type === 'success' ? 'bg-[#CBFF38]/10 text-black border border-[#CBFF38]/20' : 'bg-red-50 text-red-700 border border-red-100'
 }`}>
 {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-black" /> : <AlertCircle className="w-5 h-5" />}
 <span className="font-black uppercase text-xs tracking-widest">{msg.text}</span>
 </div>
 )}

 {isLoading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {[1, 2, 3].map(i => (
 <div key={i} className="h-80 bg-white rounded-[40px] border border-gray-100 animate-pulse" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {filteredStaff.map((member) => (
 <StaffCard 
 key={member.id} 
 member={member} 
 onRemove={() => handleRemoveStaff(member.id)} 
 onViewSchedule={() => navigate(`/clinic/appointments?providerId=${member.id}`)}
 />
 ))}
 
 {filteredStaff.length === 0 && (
 <div className="col-span-full py-32 text-center bg-white rounded-[48px] border border-dashed border-gray-200">
 <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gray-50 mb-6 text-gray-200">
 <Users size={40} />
 </div>
 <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">No Personnel Match</h2>
 <p className="text-gray-400 font-medium">Clear your filters or enlist a new team member.</p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Premium Add Staff Modal */}
 {showAddModal && (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
 <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-auto animate-in zoom-in-95 duration-200">
 <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-100 flex justify-between items-center bg-black text-white shrink-0">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="size-2 rounded-full bg-[#CBFF38]" />
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38]">
 {isGreek ? 'Διαχείριση Κλινικής' : 'Clinic Management'}
 </span>
 </div>
 <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
 {isGreek ? 'Προσθήκη μέλους προσωπικού' : 'Add Staff Member'}
 </h2>
 <p className="text-xs text-gray-400 font-medium">
 {isGreek ? 'Στοιχεία λογαριασμού και ρόλος μέλους' : 'Staff credentials and clinic role'}
 </p>
 </div>
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="size-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors text-white shrink-0 ml-4"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleAddStaff} autoComplete="off" className="p-6 md:p-8 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
 <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
 <span className="font-bold text-slate-500 uppercase tracking-wide">
 {isGreek ? 'Κλινική Ανάθεσης' : 'Assigned Clinic'}:
 </span>
 <span className="font-black text-indigo-600 uppercase">
 {profile?.name || (user as any)?.assignedClinic?.name || 'Current Clinic'}
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
 {isGreek ? 'Όνομα *' : 'First Name *'}
 </label>
 <input
 required
 type="text"
 placeholder="Jane"
 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm font-semibold transition-all"
 value={newStaff.firstName}
 onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
 {isGreek ? 'Επώνυμο *' : 'Last Name *'}
 </label>
 <input
 required
 type="text"
 placeholder="Doe"
 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm font-semibold transition-all"
 value={newStaff.lastName}
 onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
 {isGreek ? 'Email Address *' : 'Email Address *'}
 </label>
 <input
 required
 type="email"
 name="new-staff-email"
 autoComplete="off"
 placeholder="specialist@clinic.com"
 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm font-semibold transition-all"
 value={newStaff.email}
 onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
 />
 </div>

 <p className="text-[11px] text-gray-500 font-medium">
 {isGreek ? 'Το αίτημα πηγαίνει στον διαχειριστή για έγκριση. Μετά την έγκριση, το νέο μέλος λαμβάνει email για να ορίσει τον δικό του κωδικό.' : 'The request goes to the admin for approval. Once approved, the new member gets an email to set their own password.'}
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
 {isGreek ? 'Ρόλος / Ειδικότητα *' : 'Role / Position *'}
 </label>
 <select
 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm font-bold uppercase transition-all cursor-pointer"
 value={newStaff.role}
 onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
 >
 <option value="doctor">{isGreek ? 'Ιατρός (Doctor)' : 'Medical Doctor'}</option>
 <option value="secretariat">{isGreek ? 'Γραμματεία (Front Office)' : 'Front Office / Secretary'}</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
 {isGreek ? 'Τηλέφωνο' : 'Phone Number'}
 </label>
 <input
 type="text"
 placeholder="+30 69..."
 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-black text-sm font-semibold transition-all"
 value={newStaff.phone}
 onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
 />
 </div>
 </div>

 <div className="pt-2">
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full h-12 bg-[#CBFF38] text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-black hover:text-[#CBFF38] transition-all shadow-lg shadow-lime-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {isSubmitting ? (
 <span>{isGreek ? 'Προσθήκη...' : 'Enrolling...'}</span>
 ) : (
 <span>{isGreek ? 'Αποστολή αιτήματος' : 'Send request'}</span>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

/* --- Sub-Components --- */

const StaffCard = ({ member, onRemove, onViewSchedule }: any) => {
 return (
 <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:border-black transition-all duration-300 group relative">
 <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
 <button
 type="button"
 onClick={(e) => {
   e.stopPropagation();
   onRemove();
 }}
 title="Remove staff member"
 className="size-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all border border-gray-100 hover:border-red-200 shadow-sm"
 >
 <Trash2 size={13} />
 </button>
 </div>

 <div className="flex flex-col h-full">
 <div className="flex items-start gap-4 mb-6">
 <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-[#CBFF38] transition-all duration-500">
 <Users size={22} strokeWidth={2.5} />
 </div>
 <div className="flex-1 min-w-0 pt-1">
 <div className="flex items-center gap-2 mb-1.5">
 <span className="text-[8px] font-black bg-black text-[#CBFF38] px-2 py-0.5 rounded flex items-center gap-1 tracking-widest uppercase">
 <Shield size={8} />
 {member.role?.replace('_', ' ')}
 </span>
 {member.isActive && (
 <div className="size-1.5 bg-green-500 rounded-full" />
 )}
 {member.profile?.staffRequest?.status === 'pending' && (
 <span className="text-[8px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded tracking-widest uppercase">
 {localStorage.getItem('preferredLang') === 'el' ? 'Σε αναμονή έγκρισης' : 'Pending approval'}
 </span>
 )}
 </div>
 <h3 className="text-xl font-black tracking-tighter text-gray-900 leading-none truncate">
 {member.firstName} {member.lastName}
 </h3>
 </div>
 </div>

 <div className="space-y-2 mb-6">
 <div className="px-3 py-2 bg-gray-50/50 rounded-xl flex items-center gap-3 border border-gray-50/50">
 <Mail className="text-gray-400" size={12} />
 <span className="text-[10px] font-bold truncate text-gray-600">{member.email}</span>
 </div>
 {member.phone && (
 <div className="px-3 py-2 bg-gray-50/50 rounded-xl flex items-center gap-3 border border-gray-50/50">
 <Phone className="text-gray-400" size={12} />
 <span className="text-[10px] font-bold text-gray-600">{member.phone}</span>
 </div>
 )}
 </div>

 <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
 <p className="text-[7px] font-black uppercase tracking-widest text-gray-300">Clearance Active</p>
 <button 
 onClick={onViewSchedule}
 className="text-[9px] font-black uppercase tracking-widest text-black hover:opacity-50 transition-all border-b-2 border-transparent hover:border-[#CBFF38]"
 >
 Timeline
 </button>
 </div>
 </div>
 </div>
 );
};

export default StaffPage;
