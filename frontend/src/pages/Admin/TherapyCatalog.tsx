import React, { useEffect, useState } from "react";
import { adminAPI } from "@/services/api";
import {
    Tag,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Check,
    X,
    Image as ImageIcon,
    Info,
    MoreVertical,
    CheckCircle2,
    AlertCircle,
    Clock,
    Star
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/atoms/Button/Button";
import ImageUpload from "@/components/atoms/ImageUpload";

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const origin = baseUrl.replace(/\/api$/, '');
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface masterTreatment {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    category: string;
    categoryId: string;
    imageUrl?: string;
    isFeatured?: boolean;
    sortOrder?: number;
    status: 'pending' | 'approved' | 'rejected';
    isActive: boolean;
    createdAt: string;
    categoryRef?: { name: string };
    offerings?: Array<{ id: string; clinicId: string; isActive: boolean }>;
}

interface Clinic {
    id: string;
    name: string;
}

interface masterCategory {
    id: string;
    name: string;
    description: string;
    icon?: string;
    parentId?: string | null;
    sortOrder?: number;
    status: 'pending' | 'approved' | 'rejected';
    isActive: boolean;
}

export const TherapyCatalog: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'treatments' | 'categories' | 'approval'>('treatments');
    const [treatments, setTreatments] = useState<masterTreatment[]>([]);
    const [categories, setCategories] = useState<masterCategory[]>([]);
    const [pendingItems, setPendingItems] = useState<masterTreatment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [clinics, setClinics] = useState<Clinic[]>([]);

    // Modal state
    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [treatmentForm, setTreatmentForm] = useState<{
        name: string;
        categoryId: string;
        shortDescription: string;
        fullDescription: string;
        imageUrl: string;
        isFeatured: boolean;
        isActive: boolean;
        clinicIds: string[];
    }>({
        name: "",
        categoryId: "",
        shortDescription: "",
        fullDescription: "",
        imageUrl: "",
        isFeatured: false,
        isActive: true,
        clinicIds: []
    });

    const [categoryForm, setCategoryForm] = useState({
        name: "",
        description: "",
        icon: "",
        parentId: "",
        isActive: true
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [treatmentsRes, categoriesRes, pendingRes, clinicsRes] = await Promise.all([
                adminAPI.getMasterTreatments({ status: 'approved' }),
                adminAPI.getMasterCategories(),
                adminAPI.getPendingTreatments(),
                adminAPI.getClinics()
            ]);
            setTreatments(treatmentsRes.data || []);
            setCategories(categoriesRes.data || []);
            setPendingItems(pendingRes.data || []);
            setClinics(clinicsRes.data?.clinics || []);
        } catch (err: any) {
            setError("Failed to load catalog data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTreatment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await adminAPI.updateMasterTreatment(editingItem.id, treatmentForm);
            } else {
                await adminAPI.createMasterTreatment(treatmentForm);
            }
            setIsTreatmentModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Send parentId only when a parent is chosen; null on edit clears it to top-level.
            const payload: any = { ...categoryForm };
            if (!payload.parentId) payload.parentId = editingItem ? null : undefined;
            if (editingItem) {
                await adminAPI.updateMasterCategory(editingItem.id, payload);
            } else {
                await adminAPI.createMasterCategory(payload);
            }
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteTreatment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this therapy? If it has historical booking records, it will be safely archived (deactivated) instead of hard-deleted to preserve history.")) return;
        try {
            await adminAPI.deleteMasterTreatment(id);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleDeleteCategory = async (cat: masterCategory) => {
        if (!confirm(`Delete category "${cat.name}"? Any treatments in it will become uncategorised and can be re-assigned to another category later.`)) return;
        try {
            const res = await adminAPI.deleteMasterCategory(cat.id);
            const unmapped = res.data?.unmappedTreatments ?? 0;
            if (unmapped > 0) {
                alert(`Category deleted. ${unmapped} treatment(s) were unmapped — re-assign them to a category from the Treatments tab.`);
            }
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete category");
        }
    };

    const handleSetStatus = async (id: string, status: string) => {
        try {
            await adminAPI.setTreatmentStatus(id, status);
            fetchData();
        } catch (err: any) {
            alert("Failed to update status");
        }
    };

    const openTreatmentModal = (item?: masterTreatment) => {
        if (item) {
            setEditingItem(item);
            const linkedClinicIds = item.offerings
                ? item.offerings.filter((o: any) => o.isActive).map((o: any) => o.clinicId)
                : [];
            setTreatmentForm({
                name: item.name,
                categoryId: item.categoryId,
                shortDescription: item.shortDescription || "",
                fullDescription: item.fullDescription || "",
                imageUrl: item.imageUrl || "",
                isFeatured: !!item.isFeatured,
                isActive: item.isActive,
                clinicIds: linkedClinicIds
            });
        } else {
            setEditingItem(null);
            setTreatmentForm({
                name: "",
                categoryId: categories[0]?.id || "",
                shortDescription: "",
                fullDescription: "",
                imageUrl: "",
                isFeatured: false,
                isActive: true,
                clinicIds: []
            });
        }
        setIsTreatmentModalOpen(true);
    };

    const filteredTreatments = treatments
        .filter(t => t.isActive)
        .filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.categoryRef?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Category tree helpers (two levels: top-level categories + their subcategories)
    const topLevelCategories = categories.filter(c => !c.parentId);
    const subcategoriesOf = (parentId: string) => categories.filter(c => c.parentId === parentId);

    const handleToggleFeatured = async (t: masterTreatment) => {
        try {
            await adminAPI.updateMasterTreatment(t.id, { isFeatured: !t.isFeatured });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update featured status");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
                        Therapy Catalog
                    </h1>
                    <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mt-2 flex items-center gap-2">
                        <Tag className="text-[#CBFF38]" size={14} /> Master therapy catalog & category management
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => openTreatmentModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-[#CBFF38] text-black font-black rounded-2xl hover:bg-lime-400 transition-all shadow-lg shadow-lime-100 uppercase text-xs tracking-widest"
                    >
                        <Plus size={16} /> New Therapy
                    </button>
                    <button
                        onClick={() => { setEditingItem(null); setCategoryForm({ name: "", description: "", icon: "", parentId: "", isActive: true }); setIsCategoryModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0B1120] text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 uppercase text-xs tracking-widest"
                    >
                        <Plus size={16} /> New Category
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {(['treatments', 'categories', 'approval'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        {tab}
                        {tab === 'approval' && pendingItems.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">
                                {pendingItems.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold uppercase text-xs tracking-widest border border-red-100">{error}</div>}

            {activeTab === 'treatments' && (
                <div className="space-y-6">
                    <div className="relative group max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#CBFF38] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search therapies by name or category..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl outline-none focus:ring-2 focus:ring-[#CBFF38] transition-all font-medium shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTreatments.map(t => (
                            <div key={t.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                {!t.imageUrl && <div className="absolute top-0 right-0 w-24 h-24 bg-[#CBFF38]/10 rounded-bl-[64px] transition-all group-hover:scale-110 pointer-events-none" />}

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 bg-gray-50 text-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-[#CBFF38] group-hover:text-black transition-all overflow-hidden">
                                            {t.imageUrl ? <img src={getImageUrl(t.imageUrl)} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.categoryRef?.name || t.category}</span>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tighter italic text-lg leading-tight group-hover:text-[#CBFF38] transition-colors line-clamp-1">{t.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleToggleFeatured(t)}
                                            title={t.isFeatured ? "Remove from Top Treatments" : "Mark as Top Treatment"}
                                            className={`p-2 rounded-xl transition-all ${t.isFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'}`}
                                        >
                                            <Star size={16} fill={t.isFeatured ? 'currentColor' : 'none'} />
                                        </button>
                                        <button onClick={() => openTreatmentModal(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteTreatment(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed italic border-l-2 border-gray-100 pl-4">
                                    {t.shortDescription || "No description available."}
                                </p>

                                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        {t.isActive ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-lime-50 text-lime-600 border border-lime-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircle2 size={10} /> Published
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <AlertCircle size={10} /> Draft
                                            </span>
                                        )}
                                        {t.isFeatured && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <Star size={10} fill="currentColor" /> Top
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(t.createdAt), "MMM d, yyyy")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="space-y-6">
                    {topLevelCategories.map(cat => {
                        const subs = subcategoriesOf(cat.id);
                        const editCat = (c: masterCategory) => { setEditingItem(c); setCategoryForm({ name: c.name, description: c.description || "", icon: c.icon || "", parentId: c.parentId || "", isActive: c.isActive }); setIsCategoryModalOpen(true); };
                        return (
                            <div key={cat.id} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-800 font-black italic">
                                            {cat.icon || cat.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 uppercase tracking-tight italic">{cat.name}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-1 italic">{cat.description || "No description."}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => editCat(cat)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                <div className="mt-4 pl-13 flex flex-wrap gap-2">
                                    {subs.length === 0 ? (
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No subcategories</span>
                                    ) : subs.map(sub => (
                                        <span key={sub.id} className="group flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-black uppercase tracking-widest text-gray-700">
                                            {sub.icon ? <span>{sub.icon}</span> : null}
                                            {sub.name}
                                            <button onClick={() => editCat(sub)} className="text-gray-400 hover:text-blue-600"><Edit2 size={11} /></button>
                                            <button onClick={() => handleDeleteCategory(sub)} className="text-gray-400 hover:text-red-600"><Trash2 size={11} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'approval' && (
                <div className="space-y-6">
                    {pendingItems.length === 0 ? (
                        <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 italic">
                            <CheckCircle2 size={64} className="mx-auto text-lime-500 mb-6 opacity-20" />
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Everything Approved</h3>
                            <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mt-2">No pending therapy requests from clinics</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {pendingItems.map(item => (
                                <div key={item.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 px-6 py-2 bg-amber-100 text-amber-700 font-black uppercase text-[10px] tracking-widest rounded-bl-3xl">Pending Request</div>

                                    <div className="md:w-64 space-y-4">
                                        <div className="size-24 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 shadow-inner overflow-hidden">
                                            {item.imageUrl ? <img src={getImageUrl(item.imageUrl)} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-300" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Suggested Category</p>
                                            <p className="text-sm font-black text-gray-900 uppercase italic">{item.categoryRef?.name || item.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Requested On</p>
                                            <p className="text-xs font-bold text-gray-600">{format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">{item.name}</h3>
                                            <div className="grid gap-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 italic">Short Summary</p>
                                                    <p className="text-sm text-gray-700 font-medium italic">"{item.shortDescription || 'No summary provided.'}"</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 italic">Full Description</p>
                                                    <p className="text-sm text-gray-600 leading-relaxed bg-blue-50/50 border-l-4 border-blue-500 pl-4 py-2">
                                                        {item.fullDescription || 'No full details provided.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => handleSetStatus(item.id, 'approved')}
                                                className="flex-1 h-16 bg-[#CBFF38] text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-lime-400 shadow-lg shadow-lime-100 flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} /> Approve & Publish
                                            </button>
                                            <button
                                                onClick={() => handleSetStatus(item.id, 'rejected')}
                                                className="flex-1 h-16 border-2 border-gray-100 text-gray-400 font-black uppercase text-xs tracking-widest rounded-2xl hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Reject Therapy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Treatment Modal */}
            {isTreatmentModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl p-10 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsTreatmentModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-all">
                            <X size={24} />
                        </button>

                        <div className="mb-8">
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
                                {editingItem ? "Edit Therapy Record" : "New Therapy Master"}
                            </h3>
                            <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest mt-1">Master source of truth for services</p>
                        </div>

                        <form onSubmit={handleCreateTreatment} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Therapy Name *</label>
                                    <input
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-bold"
                                        value={treatmentForm.name}
                                        onChange={e => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Category *</label>
                                    <select
                                        required
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-black uppercase text-xs tracking-widest"
                                        value={treatmentForm.categoryId || ""}
                                        onChange={e => setTreatmentForm({ ...treatmentForm, categoryId: e.target.value })}
                                    >
                                        <option value="">-- Select --</option>
                                        {topLevelCategories.map(cat => (
                                            <React.Fragment key={cat.id}>
                                                <option value={cat.id}>{cat.name}</option>
                                                {subcategoriesOf(cat.id).map(sub => (
                                                    <option key={sub.id} value={sub.id}>&nbsp;&nbsp;↳ {sub.name}</option>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="size-5 accent-[#CBFF38]"
                                    checked={treatmentForm.isFeatured}
                                    onChange={e => setTreatmentForm({ ...treatmentForm, isFeatured: e.target.checked })}
                                />
                                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700">
                                    <Star size={14} className="text-amber-500" fill="currentColor" /> Feature in "Top Treatments"
                                </span>
                            </label>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Therapy Photo</label>
                                <ImageUpload 
                                    value={treatmentForm.imageUrl} 
                                    onChange={(url) => setTreatmentForm({ ...treatmentForm, imageUrl: url })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Link Clinics (Select one or more)</label>
                                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    {clinics.map(clinic => {
                                        const isSelected = treatmentForm.clinicIds.includes(clinic.id);
                                        return (
                                            <button
                                                type="button"
                                                key={clinic.id}
                                                onClick={() => {
                                                    const updatedIds = isSelected
                                                        ? treatmentForm.clinicIds.filter(id => id !== clinic.id)
                                                        : [...treatmentForm.clinicIds, clinic.id];
                                                    setTreatmentForm({ ...treatmentForm, clinicIds: updatedIds });
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? "bg-[#CBFF38]/10 border-[#CBFF38] text-gray-900 font-bold"
                                                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                                }`}
                                            >
                                                <div className={`size-4 rounded flex items-center justify-center border transition-all ${
                                                    isSelected ? "bg-[#CBFF38] border-[#CBFF38] text-black" : "border-gray-300 bg-white"
                                                }`}>
                                                    {isSelected && <Check size={10} strokeWidth={4} />}
                                                </div>
                                                <span className="text-[11px] uppercase tracking-wide truncate">{clinic.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Short Summary *</label>
                                <textarea
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-medium h-24"
                                    value={treatmentForm.shortDescription}
                                    onChange={e => setTreatmentForm({ ...treatmentForm, shortDescription: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Detailed Description</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-medium h-40"
                                    value={treatmentForm.fullDescription}
                                    onChange={e => setTreatmentForm({ ...treatmentForm, fullDescription: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setIsTreatmentModalOpen(false)} className="flex-1 h-14 bg-gray-50 text-gray-500 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-100">Cancel</button>
                                <button type="submit" className="flex-1 h-14 bg-[#CBFF38] text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-lime-400">Save Therapy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 relative">
                        <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={20} /></button>

                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">{editingItem ? "Edit Category" : "New Category"}</h3>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Category Name</label>
                                <input
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-bold"
                                    value={categoryForm.name}
                                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Parent Category</label>
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-black uppercase text-xs tracking-widest"
                                    value={categoryForm.parentId || ""}
                                    onChange={e => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                                >
                                    <option value="">— None (top-level) —</option>
                                    {topLevelCategories
                                        .filter(c => !editingItem || c.id !== editingItem.id)
                                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <p className="text-[10px] text-gray-400 italic ml-1">Pick a parent to make this a subcategory. Leave as top-level otherwise.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Category Icon</label>
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-bold text-center text-2xl"
                                    placeholder="Icon identifier..."
                                    value={categoryForm.icon}
                                    onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Description</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#CBFF38] font-medium h-24"
                                    value={categoryForm.description}
                                    onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full h-14 bg-[#0B1120] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-800">
                                {editingItem ? "Update Category" : "Create Category"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
