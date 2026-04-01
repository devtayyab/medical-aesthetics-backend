import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "@/store";
import {
    Users,
    UserPlus,
    Trash2,
    Mail,
    Phone,
    Shield,
    Search,
    MoreVertical,
    X,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import { Card, CardContent } from "@/components/molecules/Card/Card";
import clinicApi from "@/services/api/clinicApi";

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone?: string;
    isActive: boolean;
}

const StaffPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { profile } = useSelector((state: RootState) => state.clinic);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // New Staff State
    const [newStaff, setNewStaff] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "doctor",
        phone: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            const data = await clinicApi.staff.getAll();
            setStaff(data);
        } catch (error) {
            console.error("Failed to fetch staff:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [profile?.id]);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMsg(null);
        try {
            await clinicApi.staff.create(newStaff);
            setMsg({ type: 'success', text: "Staff member created successfully!" });
            setShowAddModal(false);
            setNewStaff({ firstName: "", lastName: "", email: "", password: "", role: "doctor", phone: "" });
            fetchStaff();
        } catch (error: any) {
            setMsg({ type: 'error', text: error.response?.data?.message || "Failed to create staff member" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveStaff = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this staff member? They will no longer be associated with this clinic.")) return;
        try {
            await clinicApi.staff.remove(id);
            fetchStaff();
        } catch (error) {
            alert("Failed to remove staff");
        }
    };

    const filteredStaff = staff.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Premium Header Section */}
            <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                            <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Operational Force</span>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Personnel Registry</h1>
                            <p className="text-gray-400 font-medium max-w-md">Manage your clinical elite. Coordinate doctors, specialists, and support teams.</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="group h-14 px-8 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-xl shadow-lime-500/10 flex items-center gap-3"
                    >
                        <UserPlus className="group-hover:rotate-12 transition-transform duration-300" size={18} />
                        Enlist New Specialist
                    </button>
                </div>
            </div>

            {/* Search & Stats Bar */}
            <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 space-y-8 pb-20">
                <div className="bg-white p-4 rounded-[32px] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Identify personal by name, email or designation..."
                            className="w-full pl-14 pr-6 h-14 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all font-bold text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-14 px-6 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100 italic">
                            <Users size={18} className="text-gray-400" />
                            <span className="text-sm font-black uppercase italic tracking-tighter">{filteredStaff.length} TOTAL</span>
                        </div>
                    </div>
                </div>

                {msg && (
                    <div className={`p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
                        msg.type === 'success' ? 'bg-[#CBFF38]/10 text-black border border-[#CBFF38]/20' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                        {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-black" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-black uppercase text-xs tracking-widest italic">{msg.text}</span>
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
                                onViewSchedule={() => navigate('/clinic/appointments')}
                            />
                        ))}
                        
                        {filteredStaff.length === 0 && (
                            <div className="col-span-full py-32 text-center bg-white rounded-[48px] border border-dashed border-gray-200">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gray-50 mb-6 text-gray-200">
                                    <Users size={40} />
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 mb-2">No Personnel Match</h2>
                                <p className="text-gray-400 font-medium">Clear your filters or enlist a new team member.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-black text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Personnel Intake</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38] mt-1 italic">Credential Provisioning</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="size-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Identity Alpha</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Jane"
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold"
                                        value={newStaff.firstName}
                                        onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Identity Beta</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Doe"
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold"
                                        value={newStaff.lastName}
                                        onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Digital Coordinates</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="specialist@clinic.com"
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Secure Protocol</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    minLength={8}
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold tracking-widest"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Expertise Tier</label>
                                    <select
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-black uppercase italic appearance-none cursor-pointer"
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    >
                                        <option value="doctor">Medical Doctor</option>
                                        <option value="secretariat">Front Office</option>
                                        <option value="salesperson">Revenue Agent</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Comm Link</label>
                                    <input
                                        type="text"
                                        placeholder="+44 20 ..."
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 bg-[#CBFF38] text-black font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-black hover:text-[#CBFF38] transition-all shadow-xl shadow-lime-500/10 disabled:opacity-50"
                            >
                                {isSubmitting ? "ENROLLING..." : "COMMIT ENROLLMENT"}
                            </button>
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
        <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm hover:border-black hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onRemove}
                    className="size-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="flex flex-col h-full">
                <div className="flex items-center gap-6 mb-8">
                    <div className="size-20 rounded-[28px] bg-black flex items-center justify-center text-[#CBFF38] shadow-lg group-hover:rotate-6 transition-transform">
                        <Users size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-[#CBFF38] text-black px-2 py-0.5 rounded-full italic tracking-widest uppercase">
                                {member.role?.replace('_', ' ')}
                            </span>
                            {member.isActive && (
                                <div className="size-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
                            {member.firstName} {member.lastName}
                        </h3>
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group-hover:bg-black group-hover:text-white transition-colors">
                        <Mail className="text-[#CBFF38]" size={16} />
                        <span className="text-xs font-bold truncate italic">{member.email}</span>
                    </div>
                    {member.phone && (
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 group-hover:bg-black group-hover:text-white transition-colors">
                            <Phone className="text-[#CBFF38]" size={16} />
                            <span className="text-xs font-bold italic">{member.phone}</span>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-gray-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Security Clearance Level 4</span>
                    </div>
                    <button 
                        onClick={onViewSchedule}
                        className="text-[10px] font-black uppercase tracking-widest text-black hover:text-[#CBFF38] transition-colors italic decoration-[#CBFF38] underline underline-offset-4"
                    >
                        View Schedule
                    </button>
                </div>
            </div>
        </div>
  );
};

export default StaffPage;
