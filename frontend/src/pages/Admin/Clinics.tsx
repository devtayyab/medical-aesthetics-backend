import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Building2, Edit2, Plus, Search, MapPin,
    Clock, CheckCircle2, XCircle, Save, X, Trash2, Eye
} from "lucide-react";
import { fetchAdminClinics, createAdminClinic, updateAdminClinic, fetchUsers } from "@/store/slices/adminSlice";
import { adminAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";

export const Clinics: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { clinics, isLoading, error, users } = useSelector((state: RootState) => state.admin);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
    const [activeTab, setActiveTab] = useState<"profile" | "hours" | "staff" | "blocked" | "services">("profile");
    const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
    const [clinicServices, setClinicServices] = useState<any[]>([]);
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const [serviceForm, setServiceForm] = useState({
        name: "",
        category: "Dermal Fillers",
        price: 350,
        durationMinutes: 45,
        shortDescription: "",
        fullDescription: "",
        imageUrl: ""
    });
    const [isBlocking, setIsBlocking] = useState(false);
    const [blockForm, setBlockForm] = useState({
        startTime: "",
        endTime: "",
        reason: ""
    });

    // Form State
    const [formData, setFormData] = useState<Partial<Clinic>>({
        name: "",
        description: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
        },
        phone: "",
        email: "",
        website: "",
        latitude: 0,
        longitude: 0,
        isActive: true,
        ownerId: "",
    });

    useEffect(() => {
        dispatch(fetchAdminClinics());
        dispatch(fetchUsers());
    }, [dispatch]);

    const fetchClinicBlockedSlots = async (clinicId: string) => {
        try {
            const res = await adminAPI.getBlockedSlots(clinicId);
            setBlockedSlots(res.data);
        } catch (err) {
            console.error("Failed to fetch blocked slots", err);
        }
    };

    const fetchClinicServices = async (clinicId: string) => {
        try {
            const res = await adminAPI.getClinicServices(clinicId);
            setClinicServices(res.data);
        } catch (err) {
            console.error("Failed to fetch clinic services", err);
        }
    };

    useEffect(() => {
        if (editingClinic) {
            if (activeTab === 'blocked') fetchClinicBlockedSlots(editingClinic.id);
            if (activeTab === 'services') fetchClinicServices(editingClinic.id);
        }
    }, [editingClinic, activeTab]);

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClinic) return;
        try {
            if (editingService) {
                await adminAPI.updateClinicService(editingService.id, { ...serviceForm, clinicId: editingClinic.id });
            } else {
                await adminAPI.createClinicService({ ...serviceForm, clinicId: editingClinic.id });
            }
            setIsAddingService(false);
            setEditingService(null);
            setServiceForm({
                name: "",
                category: "Dermal Fillers",
                price: 350,
                durationMinutes: 45,
                shortDescription: "",
                fullDescription: "",
                imageUrl: ""
            });
            fetchClinicServices(editingClinic.id);
        } catch (err) {
            console.error("Failed to save service", err);
        }
    };

    const handleEditService = (service: any) => {
        setEditingService(service);
        setServiceForm({
            name: service.treatment?.name || service.name || "",
            category: service.treatment?.category || service.category || "",
            price: service.price,
            durationMinutes: service.durationMinutes,
            shortDescription: service.treatment?.shortDescription || service.description || "",
            fullDescription: service.treatment?.fullDescription || "",
            imageUrl: service.treatment?.imageUrl || service.imageUrl || ""
        });
        setIsAddingService(true);
    };

    const handleUnblockSlot = async (slotId: string) => {
        try {
            await adminAPI.unblockSlot(slotId);
            if (editingClinic) fetchClinicBlockedSlots(editingClinic.id);
        } catch (err) {
            console.error("Failed to unblock slot", err);
        }
    };

    const handleBlockSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClinic) return;
        try {
            await (adminAPI as any).blockSlot({
                ...blockForm,
                clinicId: editingClinic.id
            });
            setIsBlocking(false);
            setBlockForm({ startTime: "", endTime: "", reason: "" });
            fetchClinicBlockedSlots(editingClinic.id);
        } catch (err) {
            console.error("Failed to block slot", err);
        }
    };

    const handleOpenModal = (clinic?: Clinic) => {
        if (clinic) {
            setEditingClinic(clinic);
            setActiveTab("profile");
            setFormData({
                ...clinic,
            });
        } else {
            setEditingClinic(null);
            setActiveTab("profile");
            setFormData({
                name: "",
                description: "",
                address: { street: "", city: "", state: "", zipCode: "", country: "" },
                phone: "",
                email: "",
                website: "",
                latitude: 0,
                longitude: 0,
                isActive: true,
                ownerId: "",
                businessHours: {
                    monday: { open: "09:00", close: "18:00", isOpen: true },
                    tuesday: { open: "09:00", close: "18:00", isOpen: true },
                    wednesday: { open: "09:00", close: "18:00", isOpen: true },
                    thursday: { open: "09:00", close: "18:00", isOpen: true },
                    friday: { open: "09:00", close: "18:00", isOpen: true },
                    saturday: { open: "09:00", close: "18:00", isOpen: false },
                    sunday: { open: "09:00", close: "18:00", isOpen: false },
                }
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClinic(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClinic) {
            dispatch(updateAdminClinic({ id: editingClinic.id, data: formData }));
        } else {
            dispatch(createAdminClinic(formData));
        }
        handleCloseModal();
    };

    const filteredClinics = clinics.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Clinics Management</h2>
                    <p className="text-gray-500">Manage all clinics, their profiles, and status</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CBFF38] text-[#0B1120] font-bold rounded-xl hover:bg-[#b0f020] transition-colors shadow-md"
                >
                    <Plus className="w-5 h-5" /> Add New Clinic
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or city..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic Profile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading clinics...</td>
                                </tr>
                            )}
                            {!isLoading && filteredClinics.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No clinics found.</td>
                                </tr>
                            )}
                            {filteredClinics.map((clinic) => (
                                <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                {clinic.photoUrl ? (
                                                    <img src={clinic.photoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <Building2 className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{clinic.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{clinic.email || "No email"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{clinic.address?.city}, {clinic.address?.country}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{clinic.owner?.firstName} {clinic.owner?.lastName}</div>
                                        <div className="text-xs text-gray-500">{clinic.ownerId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${clinic.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}>
                                            {clinic.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(clinic)}
                                            className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{editingClinic ? "Edit Clinic" : "Create New Clinic"}</h3>
                                <p className="text-sm text-gray-500">{editingClinic ? editingClinic.name : "Fill in details"}</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {editingClinic && (
                            <div className="px-6 py-2 bg-white border-b border-gray-100 flex gap-4 overflow-x-auto">
                                {(["profile", "hours", "staff", "blocked", "services"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab
                                            ? "border-[#CBFF38] text-[#0B1120]"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                            {activeTab === 'profile' && (
                                <>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-[#CBFF38] pl-3">General Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Clinic Name *</label>
                                                <input
                                                    type="text" required
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Gallery Images (Comma separated URLs)</label>
                                                <textarea
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none h-20 resize-none"
                                                    value={formData.images ? formData.images.join(", ") : ""}
                                                    onChange={e => setFormData({ ...formData, images: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
                                                    placeholder="https://image1.jpg, https://image2.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-gray-900 border-l-4 border-[#CBFF38] pl-3">Owner Information</h4>
                                            <button
                                                type="button"
                                                onClick={() => window.location.href = '/admin/users'}
                                                className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Create New Owner
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Select Owner *</label>
                                                <select
                                                    required
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none bg-white"
                                                    value={formData.ownerId || ""}
                                                    onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
                                                >
                                                    <option value="">-- Choose Owner --</option>
                                                    {users
                                                        .filter(u => u.role === 'clinic_owner')
                                                        .map(owner => (
                                                            <option key={owner.id} value={owner.id}>
                                                                {owner.firstName} {owner.lastName} ({owner.email})
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                {users.filter(u => u.role === 'clinic_owner').length === 0 && (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1">
                                                        No users with "Clinic Owner" role found. Please create one first.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-[#CBFF38] pl-3">Contact & Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.email || ""}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.phone || ""}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Website</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.website || ""}
                                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">City</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.address?.city || ""}
                                                    onChange={e => setFormData({ ...formData, address: { ...(formData.address || { street: "", city: "", state: "", zipCode: "", country: "" }), city: e.target.value } })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-gray-700">Lat</label>
                                                    <input type="number" step="any" className="w-full p-2.5 border border-gray-200 rounded-xl" value={formData.latitude ?? 0} onChange={e => setFormData({ ...formData, latitude: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-gray-700">Long</label>
                                                    <input type="number" step="any" className="w-full p-2.5 border border-gray-200 rounded-xl" value={formData.longitude ?? 0} onChange={e => setFormData({ ...formData, longitude: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'services' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">Clinic Services</h4>
                                            <p className="text-sm text-gray-500">Add or manage services offered at this location</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingService(!isAddingService);
                                                if (!isAddingService) {
                                                    setEditingService(null);
                                                    setServiceForm({
                                                        name: "", category: "Dermal Fillers", price: 350, durationMinutes: 45,
                                                        shortDescription: "", fullDescription: "", imageUrl: ""
                                                    });
                                                }
                                            }}
                                            className="px-4 py-2 bg-[#CBFF38] text-[#0B1120] font-bold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
                                        >
                                            {isAddingService ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {isAddingService ? "Cancel" : "Add Service"}
                                        </button>
                                    </div>

                                    {isAddingService && (
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-inner space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service Name</label>
                                                        <input
                                                            type="text" required
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none transition-all"
                                                            value={serviceForm.name}
                                                            onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                                                            placeholder="e.g. Lip Filler"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (€)</label>
                                                            <input
                                                                type="number" required
                                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                                                                value={serviceForm.price}
                                                                onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration (min)</label>
                                                            <input
                                                                type="number" required
                                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                                                                value={serviceForm.durationMinutes}
                                                                onChange={e => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                                                        <select
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                                                            value={serviceForm.category}
                                                            onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                                                        >
                                                            <option>Dermal Fillers</option>
                                                            <option>Facial Treatments</option>
                                                            <option>Laser Therapy</option>
                                                            <option>Skin Boosters</option>
                                                            <option>Anti-Aging</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Image URL</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                                                            value={serviceForm.imageUrl}
                                                            onChange={e => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Short Description</label>
                                                <textarea
                                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none h-20 resize-none"
                                                    value={serviceForm.shortDescription}
                                                    onChange={e => setServiceForm({ ...serviceForm, shortDescription: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveService}
                                                    className="px-8 py-2.5 bg-[#0B1120] text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" /> {editingService ? "Update Service" : "Create Service"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!isAddingService && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {clinicServices.map(service => (
                                                <div
                                                    key={service.id}
                                                    className="group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-xl hover:border-[#CBFF38]/30 transition-all duration-300 flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${service.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                                                }`}>
                                                                {service.isActive ? "Active" : "Hidden"}
                                                            </div>
                                                            <div className="text-xs text-gray-400 font-medium">#{service.id.slice(0, 8)}</div>
                                                        </div>
                                                        <h5 className="font-bold text-gray-900 group-hover:text-[#CBFF38] transition-colors line-clamp-1">
                                                            {service.treatment?.name || service.name || "Unnamed Service"}
                                                        </h5>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">
                                                            {service.treatment?.shortDescription || service.description || "No description available."}
                                                        </p>
                                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                                            <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center">
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Price</span>
                                                                <span className="font-bold text-gray-900">€{service.price}</span>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center">
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Time</span>
                                                                <span className="font-bold text-gray-900">{service.durationMinutes}m</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditService(service)}
                                                            className="flex-1 text-xs font-bold py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-[#CBFF38]/20 hover:text-gray-900 transition-all"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`p-2 rounded-lg transition-all ${service.isActive ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                                                                }`}
                                                            title={service.isActive ? "Deactivate" : "Activate"}
                                                            onClick={async () => {
                                                                try {
                                                                    await adminAPI.toggleServiceStatus(service.id, editingClinic!.id);
                                                                    fetchClinicServices(editingClinic!.id);
                                                                } catch (err) {
                                                                    console.error("Toggle failed", err);
                                                                }
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {clinicServices.length === 0 && (
                                                <div className="col-span-full py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <Plus className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <h5 className="font-bold text-gray-900">No services yet</h5>
                                                    <p className="text-sm text-gray-500 max-w-xs mt-1">
                                                        This clinic doesn't have any services listed. Click "Add Service" to get started.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'staff' && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900">Assigned Staff</h4>
                                    <div className="grid gap-2">
                                        {users.filter(u => u.assignedClinics?.some(c => c.id === editingClinic?.id) || u.id === editingClinic?.ownerId).map(u => (
                                            <div key={u.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                                                <span>{u.firstName} {u.lastName} ({u.role})</span>
                                                {u.id === editingClinic?.ownerId && <span className="text-xs bg-amber-100 text-amber-700 px-2 rounded">Owner</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'blocked' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-900">Blocked Slots</h4>
                                        <button
                                            type="button"
                                            onClick={() => setIsBlocking(!isBlocking)}
                                            className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> {isBlocking ? "Cancel" : "Block New Slot"}
                                        </button>
                                    </div>

                                    {isBlocking && (
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Start Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full p-2 bg-white border rounded-lg text-sm"
                                                        value={blockForm.startTime}
                                                        onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">End Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        className="w-full p-2 bg-white border rounded-lg text-sm"
                                                        value={blockForm.endTime}
                                                        onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Reason</label>
                                                <input
                                                    type="text"
                                                    placeholder="Short break, Maintenance, etc."
                                                    className="w-full p-2 bg-white border rounded-lg text-sm"
                                                    value={blockForm.reason}
                                                    onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleBlockSlot}
                                                    className="bg-[#CBFF38] text-[#0B1120] font-bold px-4 py-2 rounded-lg text-sm shadow-sm"
                                                >
                                                    Confirm Block
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        {blockedSlots.map(s => (
                                            <div key={s.id} className="p-3 bg-red-50 rounded-xl flex justify-between items-center text-red-700 border border-red-100">
                                                <div>
                                                    <div className="font-bold text-sm">{s.reason || "Blocked Slot"}</div>
                                                    <div className="text-xs">
                                                        {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleString()}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUnblockSlot(s.id)}
                                                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {blockedSlots.length === 0 && !isBlocking && (
                                            <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                                <XCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500">No blocked slots found for this clinic.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-8 py-2.5 bg-[#0B1120] text-white rounded-xl hover:bg-black font-bold transition-all shadow-lg"
                                >
                                    <Save className="w-5 h-5" /> {editingClinic ? "Update Clinic" : "Create Clinic"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
