import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Staff Management
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Manage your clinic's doctors, secretariat, and other staff members.</p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 px-6 py-6"
                >
                    <UserPlus className="w-5 h-5 mr-2" /> Add New Staff
                </Button>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search staff by name or email..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {msg && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold">{msg.text}</span>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((member) => (
                        <Card key={member.id} className="border-none shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300 rounded-3xl group overflow-hidden bg-white">
                            <CardContent className="p-0">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <Users className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStaff(member.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 mb-1">{member.firstName} {member.lastName}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.role === 'doctor' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {member.role?.replace('_', ' ')}
                                        </span>
                                        {member.isActive && (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium truncate">{member.email}</span>
                                        </div>
                                        {member.phone && (
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium">{member.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50/50 flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="font-bold text-gray-500">View Schedule</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredStaff.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                                <Users className="w-10 h-10 text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">No staff members found</h2>
                            <p className="text-gray-500 font-medium">Try adjusting your search or add a new staff member.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hire New Staff</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        value={newStaff.firstName}
                                        onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        value={newStaff.lastName}
                                        onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Temporary Password</label>
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Role</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                    >
                                        <option value="doctor">Doctor</option>
                                        <option value="secretariat">Secretariat</option>
                                        <option value="salesperson">Salesperson</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-2xl shadow-xl shadow-indigo-500/20"
                            >
                                Hire Staff Member
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPage;
