import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Building2, Edit2, Plus, Search, MapPin,
    Clock, CheckCircle2, XCircle, Save, X, Trash2, Eye
} from "lucide-react";
import { fetchAdminClinics, createAdminClinic, updateAdminClinic, fetchUsers } from "@/store/slices/adminSlice";
import { adminAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";
import ImageUpload from "@/components/atoms/ImageUpload";

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const origin = baseUrl.replace(/\/api$/, '');
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};

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
    const [editingBlockedSlot, setEditingBlockedSlot] = useState<any | null>(null);
    const [blockForm, setBlockForm] = useState({
        startTime: "",
        endTime: "",
        reason: ""
    });

    const [ownerSearch, setOwnerSearch] = useState("");
    const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

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
        ownerIds: [],
    });

    const ownerSearchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ownerSearchRef.current && !ownerSearchRef.current.contains(e.target as Node)) {
                setShowOwnerDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        if (!window.confirm("Are you sure you want to remove this block?")) return;
        try {
            await adminAPI.unblockSlot(slotId);
            if (editingClinic) fetchClinicBlockedSlots(editingClinic.id);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to unblock slot");
            console.error("Failed to unblock slot", err);
        }
    };

    const handleEditBlockedSlot = (slot: any) => {
        setEditingBlockedSlot(slot);
        setBlockForm({
            startTime: new Date(slot.startTime).toISOString().slice(0, 16),
            endTime: new Date(slot.endTime).toISOString().slice(0, 16),
            reason: slot.reason || ""
        });
        setIsBlocking(true);
    };

    const handleBlockSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClinic) return;
        try {
            if (editingBlockedSlot) {
                await (adminAPI as any).updateBlockedSlot(editingBlockedSlot.id, {
                    ...blockForm,
                    clinicId: editingClinic.id
                });
            } else {
                await (adminAPI as any).blockSlot({
                    ...blockForm,
                    clinicId: editingClinic.id
                });
            }
            setIsBlocking(false);
            setEditingBlockedSlot(null);
            setBlockForm({ startTime: "", endTime: "", reason: "" });
            fetchClinicBlockedSlots(editingClinic.id);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to process block request");
            console.error("Failed to block slot", err);
        }
    };

    const handleOpenModal = (clinic?: Clinic) => {
        if (clinic) {
            setEditingClinic(clinic);
            setActiveTab("profile");
            setFormData({
                ...clinic,
                ownerIds: clinic.owners?.map(o => o.id) || (clinic.ownerId ? [clinic.ownerId] : []),
                businessHours: clinic.businessHours || {
                    monday: { open: "09:00", close: "18:00", isOpen: true },
                    tuesday: { open: "09:00", close: "18:00", isOpen: true },
                    wednesday: { open: "09:00", close: "18:00", isOpen: true },
                    thursday: { open: "09:00", close: "18:00", isOpen: true },
                    friday: { open: "09:00", close: "18:00", isOpen: true },
                    saturday: { open: "09:00", close: "18:00", isOpen: false },
                    sunday: { open: "09:00", close: "18:00", isOpen: false },
                }
            });
        } else {
            setEditingClinic(null);
            setActiveTab("profile");
            setFormData({
                name: "",
                description: "",
                photoUrl: "",
                images: [],
                address: { street: "", city: "", state: "", zipCode: "", country: "" },
                phone: "",
                email: "",
                website: "",
                latitude: 0,
                longitude: 0,
                isActive: true,
                ownerId: "",
                ownerIds: [],
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
        const currentOwnerIds = formData.ownerIds && formData.ownerIds.length > 0
            ? formData.ownerIds
            : (formData.ownerId ? [formData.ownerId] : []);
        if (currentOwnerIds.length === 0) {
            alert("Please select at least one clinic owner before saving.");
            return;
        }
        const submissionData = {
            ...formData,
            ownerIds: currentOwnerIds,
            ownerId: currentOwnerIds[0] || formData.ownerId || "",
        };
        if (editingClinic) {
            dispatch(updateAdminClinic({ id: editingClinic.id, data: submissionData }));
        } else {
            dispatch(createAdminClinic(submissionData));
        }
        handleCloseModal();
    };

    const handleToggleStatus = (clinic: Clinic) => {
        if (window.confirm(`Are you sure you want to ${clinic.isActive ? 'deactivate' : 'activate'} ${clinic.name}?`)) {
            dispatch(updateAdminClinic({ 
                id: clinic.id, 
                data: { isActive: !clinic.isActive } 
            }));
        }
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
                                        {clinic.owners && clinic.owners.length > 0 ? (
                                            <div className="space-y-1">
                                                {clinic.owners.map(owner => (
                                                    <div key={owner.id} className="text-sm font-medium text-gray-900">
                                                        {owner.firstName} {owner.lastName}
                                                    </div>
                                                ))}
                                                {clinic.owners.length > 1 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CBFF38]/20 text-[#0B1120]">
                                                        {clinic.owners.length} Owners
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-sm text-gray-900">{clinic.owner?.firstName} {clinic.owner?.lastName}</div>
                                                <div className="text-xs text-gray-500">{clinic.ownerId}</div>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleStatus(clinic)}
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-all hover:scale-105 active:scale-95 ${clinic.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
                                                }`}
                                            title="Click to toggle status"
                                        >
                                            {clinic.isActive ? "Active" : "Inactive"}
                                        </button>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
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
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-gray-900 border-l-4 border-[#CBFF38] pl-3">General Information</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-gray-500">Status:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${formData.isActive
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                        }`}
                                                >
                                                    {formData.isActive ? "Active" : "Inactive"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-4 md:col-span-1">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-gray-700">Clinic Name *</label>
                                                    <input
                                                        type="text" required
                                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Clinic Logo / Main Photo</label>
                                                    <ImageUpload
                                                        value={formData.photoUrl || ""}
                                                        onChange={url => setFormData({ ...formData, photoUrl: url })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4 md:col-span-2">
                                                <label className="text-sm font-medium text-gray-700 block">Gallery Images</label>
                                                
                                                <div>
                                                    <ImageUpload
                                                        label="Upload to Gallery"
                                                        onChange={url => {
                                                            if (url) {
                                                                const currentImages = formData.images || [];
                                                                setFormData({ ...formData, images: [...currentImages, url] });
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Gallery Preview ({formData.images?.length || 0})</label>
                                                    {formData.images && formData.images.length > 0 ? (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl max-h-48 overflow-y-auto">
                                                            {formData.images.map((imgUrl, idx) => (
                                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-white">
                                                                    <img 
                                                                        src={getImageUrl(imgUrl)} 
                                                                        alt="" 
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const currentImages = formData.images || [];
                                                                            setFormData({ ...formData, images: currentImages.filter((_, i) => i !== idx) });
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Remove image"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl uppercase font-bold tracking-wider">
                                                            No images in gallery yet
                                                        </div>
                                                    )}
                                                </div>
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
                                            <div className="space-y-2 col-span-1 md:col-span-2">
                                                <label className="text-sm font-medium text-gray-700 block">Clinic Owners *</label>
                                                
                                                {/* Selected Owners Tags/Chips */}
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {((formData.ownerIds && formData.ownerIds.length > 0)
                                                        ? formData.ownerIds
                                                        : (formData.ownerId ? [formData.ownerId] : [])
                                                    ).map(ownerId => {
                                                        const owner = users.find(u => u.id === ownerId);
                                                        if (!owner) return null;
                                                        return (
                                                            <div 
                                                                key={owner.id} 
                                                                className="flex items-center gap-2 bg-[#0B1120] text-white px-3 py-1.5 rounded-xl text-sm font-semibold shadow-md animate-in zoom-in-95 duration-200"
                                                            >
                                                                <span className="w-5 h-5 rounded-full bg-[#CBFF38] text-[#0B1120] flex items-center justify-center text-[10px] font-bold">
                                                                    {owner.firstName?.[0]?.toUpperCase()}{owner.lastName?.[0]?.toUpperCase()}
                                                                </span>
                                                                <span>{owner.firstName} {owner.lastName}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentOwnerIds = formData.ownerIds && formData.ownerIds.length > 0
                                                                            ? formData.ownerIds
                                                                            : (formData.ownerId ? [formData.ownerId] : []);
                                                                        const updatedOwnerIds = currentOwnerIds.filter(id => id !== owner.id);
                                                                        setFormData({ 
                                                                            ...formData, 
                                                                            ownerIds: updatedOwnerIds,
                                                                            ownerId: updatedOwnerIds[0] || ""
                                                                        });
                                                                    }}
                                                                    className="text-gray-400 hover:text-[#CBFF38] transition-colors ml-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!formData.ownerIds || formData.ownerIds.length === 0) && !formData.ownerId && (
                                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider py-1.5">No owners selected yet. Please search and add below.</span>
                                                    )}
                                                </div>

                                                {/* Search & Add Owners Input */}
                                                <div ref={ownerSearchRef} className="relative">
                                                    <div className="relative">
                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search clinic owners by name or email..."
                                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none bg-white text-sm"
                                                            value={ownerSearch}
                                                            onChange={e => {
                                                                setOwnerSearch(e.target.value);
                                                                setShowOwnerDropdown(true);
                                                            }}
                                                            onFocus={() => {
                                                                dispatch(fetchUsers());
                                                                setShowOwnerDropdown(true);
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    {showOwnerDropdown && (
                                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-40">
                                                                {users
                                                                    .filter(u => u.role === 'clinic_owner')
                                                                    .filter(u => {
                                                                        const currentIds = formData.ownerIds && formData.ownerIds.length > 0
                                                                            ? formData.ownerIds
                                                                            : (formData.ownerId ? [formData.ownerId] : []);
                                                                        return !currentIds.includes(u.id);
                                                                    })
                                                                    .filter(u => {
                                                                        const fullName = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
                                                                        return fullName.includes(ownerSearch.toLowerCase());
                                                                    })
                                                                    .map(owner => (
                                                                        <button
                                                                            key={owner.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const currentIds = formData.ownerIds && formData.ownerIds.length > 0
                                                                                    ? formData.ownerIds
                                                                                    : (formData.ownerId ? [formData.ownerId] : []);
                                                                                const newIds = [...currentIds, owner.id];
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    ownerIds: newIds,
                                                                                    ownerId: newIds[0] || ""
                                                                                });
                                                                                setOwnerSearch("");
                                                                                setShowOwnerDropdown(false);
                                                                            }}
                                                                            className="w-full text-left px-4 py-2.5 hover:bg-[#CBFF38]/10 flex items-center justify-between transition-colors border-b last:border-0 border-gray-100"
                                                                        >
                                                                            <div>
                                                                                <div className="text-sm font-bold text-gray-900">{owner.firstName} {owner.lastName}</div>
                                                                                <div className="text-xs text-gray-500">{owner.email}</div>
                                                                            </div>
                                                                            <Plus className="w-4 h-4 text-gray-400" />
                                                                        </button>
                                                                    ))
                                                                }
                                                                {users
                                                                    .filter(u => u.role === 'clinic_owner')
                                                                    .filter(u => {
                                                                        const currentIds = formData.ownerIds && formData.ownerIds.length > 0
                                                                            ? formData.ownerIds
                                                                            : (formData.ownerId ? [formData.ownerId] : []);
                                                                        return !currentIds.includes(u.id);
                                                                    })
                                                                    .filter(u => {
                                                                        const fullName = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
                                                                        return fullName.includes(ownerSearch.toLowerCase());
                                                                    }).length === 0 && (
                                                                        <div className="p-4 text-center text-xs text-gray-400 uppercase font-bold tracking-wider">
                                                                            No matching owners found
                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                    )}
                                                </div>
                                                
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
                                                <label className="text-sm font-medium text-gray-700">Street</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.address?.street || ""}
                                                    onChange={e => setFormData({ ...formData, address: { ...(formData.address || { street: "", city: "", state: "", zipCode: "", country: "" }), street: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">City</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.address?.city || ""}
                                                    onChange={e => setFormData({ ...formData, address: { ...(formData.address || { street: "", city: "", state: "", zipCode: "", country: "" }), city: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">State</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.address?.state || ""}
                                                    onChange={e => setFormData({ ...formData, address: { ...(formData.address || { street: "", city: "", state: "", zipCode: "", country: "" }), state: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Zip Code</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.address?.zipCode || ""}
                                                    onChange={e => setFormData({ ...formData, address: { ...(formData.address || { street: "", city: "", state: "", zipCode: "", country: "" }), zipCode: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700">Country</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBFF38] outline-none"
                                                    value={formData.address?.country || ""}
                                                    onChange={e => setFormData({ ...formData, address: { ...(formData.address || { street: "", city: "", state: "", zipCode: "", country: "" }), country: e.target.value } })}
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

                            {activeTab === 'hours' && (
                                <div className="space-y-6">
                                    <h4 className="font-bold text-gray-900 border-l-4 border-[#CBFF38] pl-3">Business Hours</h4>
                                    <div className="grid gap-4">
                                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
                                            <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="w-28 capitalize font-bold text-gray-700">{day}</div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer"
                                                        checked={formData.businessHours?.[day]?.isOpen || false}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            businessHours: {
                                                                ...formData.businessHours,
                                                                [day]: { ...formData.businessHours?.[day], isOpen: e.target.checked }
                                                            }
                                                        })}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBFF38]"></div>
                                                    <span className="ml-3 text-sm font-medium text-gray-600">{formData.businessHours?.[day]?.isOpen ? 'Open' : 'Closed'}</span>
                                                </label>
                                                {formData.businessHours?.[day]?.isOpen && (
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <input 
                                                            type="time" 
                                                            className="p-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#CBFF38]"
                                                            value={formData.businessHours?.[day]?.open || "09:00"}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                businessHours: {
                                                                    ...formData.businessHours,
                                                                    [day]: { ...formData.businessHours?.[day], open: e.target.value }
                                                                }
                                                            })}
                                                        />
                                                        <span className="text-gray-400">-</span>
                                                        <input 
                                                            type="time" 
                                                            className="p-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#CBFF38]"
                                                            value={formData.businessHours?.[day]?.close || "18:00"}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                businessHours: {
                                                                    ...formData.businessHours,
                                                                    [day]: { ...formData.businessHours?.[day], close: e.target.value }
                                                                }
                                                            })}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-900 border-l-4 border-[#CBFF38] pl-3">Assigned Staff</h4>
                                        <div className="relative">
                                            <select 
                                                className="p-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#CBFF38] bg-white transition-all shadow-sm"
                                                onChange={async (e) => {
                                                    const userId = e.target.value;
                                                    if (!userId || !editingClinic) return;
                                                    try {
                                                        const user = users.find(u => u.id === userId);
                                                        const currentIds = user?.assignedClinics?.map((c: any) => c.id) || [];
                                                        await adminAPI.updateUser(userId, { assignedClinicIds: [...currentIds, editingClinic.id] });
                                                        dispatch(fetchUsers());
                                                    } catch (err) {
                                                        console.error("Failed to assign staff", err);
                                                        alert("Failed to assign staff member");
                                                    }
                                                    e.target.value = "";
                                                }}
                                            >
                                                <option value="">-- Add Staff Member --</option>
                                                {users
                                                    .filter(u => 
                                                        (u.role === 'doctor' || u.role === 'secretariat' || u.role === 'salesperson') && 
                                                        !(u.assignedClinics?.some((c: any) => c.id === editingClinic?.id))
                                                    )
                                                    .map(u => (
                                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        {users.filter(u => u.assignedClinics?.some((c: any) => c.id === editingClinic?.id) || u.id === editingClinic?.ownerId).map(u => (
                                            <div key={u.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 hover:border-[#CBFF38]/30 transition-all shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 font-bold border border-gray-200 shadow-inner">
                                                        {u.firstName?.[0] || "?"}{u.lastName?.[0] || ""}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{u.role}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {u.id === editingClinic?.ownerId && (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-200">Owner</span>
                                                        </div>
                                                    )}
                                                    {u.id !== editingClinic?.ownerId && (
                                                        <button 
                                                            type="button"
                                                            onClick={async () => {
                                                                if (!window.confirm(`Remove ${u.firstName} from ${editingClinic?.name}?`)) return;
                                                                try {
                                                                    const currentIds = u.assignedClinics?.map((c: any) => c.id) || [];
                                                                    const newIds = currentIds.filter((id: string) => id !== editingClinic?.id);
                                                                    await adminAPI.updateUser(u.id, { assignedClinicIds: newIds });
                                                                    dispatch(fetchUsers());
                                                                } catch (err) {
                                                                    console.error("Failed to remove staff", err);
                                                                    alert("Failed to remove staff member");
                                                                }
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Unassign from Clinic"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
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
                                            onClick={() => {
                                                if (isBlocking) setEditingBlockedSlot(null);
                                                setIsBlocking(!isBlocking);
                                            }}
                                            className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-2"
                                        >
                                            {isBlocking ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {isBlocking ? "Cancel" : "Block New Slot"}
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
                                                    {editingBlockedSlot ? "Update Block" : "Confirm Block"}
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
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditBlockedSlot(s)}
                                                        className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                                                        title="Edit Block"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnblockSlot(s.id)}
                                                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                                                        title="Remove Block"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
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
