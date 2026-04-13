import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  fetchClinicProfile,
  updateClinicProfile,
} from "../../store/slices/clinicSlice";
import { ClinicProfile } from "../../types/clinic.types";
import { Building2, Mail, Phone, Globe, MapPin, Save, Info, ArrowRight } from "lucide-react";

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, isLoading } = useSelector(
    (state: RootState) => state.clinic
  );

  const [formData, setFormData] = useState<Partial<ClinicProfile>>({
    name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchClinicProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        description: profile.description || "",
        phone: profile.phone || "",
        email: profile.email || "",
        website: profile.website || "",
        address: {
          street: profile.address?.street || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          zipCode: profile.address?.zipCode || "",
          country: profile.address?.country || "",
        },
      });
    }
  }, [profile]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      await dispatch(updateClinicProfile(formData)).unwrap();
      alert("Clinic configuration updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Update failed. Verify operational parameters.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !profile) {
     return (
       <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
         <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Accessing clinical registry settings...</p>
       </div>
     );
  }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Minimal Header */}
            <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="size-1.5 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Core Configuration</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Global Settings</h1>
                                <p className="text-gray-500 font-medium max-w-md text-sm">Manage your clinic's digital identity and contact channels.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleSubmit()}
                                disabled={isSaving}
                                className="h-12 px-6 bg-[#CBFF38] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-[#CBFF38] transition-all shadow-lg shadow-lime-500/10 flex items-center gap-3 disabled:opacity-20"
                            >
                                <Save size={16} />
                                {isSaving ? "Persisting..." : "Commit Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="size-10 bg-black rounded-xl flex items-center justify-center text-[#CBFF38]">
                                    <Building2 size={20} />
                                </div>
                                <h2 className="text-lg font-black uppercase italic tracking-tighter text-gray-900">Entity Profiling</h2>
                            </div>

                            <div className="space-y-8">
                                <div className="relative group">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Legal Identity *</p>
                                    <input
                                        type="text"
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Clinic Name"
                                        className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div className="relative group">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Clinical Abstract / Biography</p>
                                    <textarea
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief overview of your medical excellence..."
                                        rows={4}
                                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm text-gray-900 focus:bg-white focus:border-black transition-all outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="relative group">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Primary Voice Line *</p>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                            <input
                                                type="tel"
                                                value={formData.phone || ""}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Transmission Email *</p>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                            <input
                                                type="email"
                                                value={formData.email || ""}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 relative group">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Digital Domain (Website)</p>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                            <input
                                                type="url"
                                                value={formData.website || ""}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="https://www.aestheticsexcellence.com"
                                                className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="size-10 bg-black rounded-xl flex items-center justify-center text-[#CBFF38]">
                                    <MapPin size={20} />
                                </div>
                                <h2 className="text-lg font-black uppercase italic tracking-tighter text-gray-900">Geographical Origin</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="relative group">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Street Protocol Address</p>
                                    <input
                                        type="text"
                                        value={formData.address?.street || ""}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, street: e.target.value } })}
                                        className="w-full h-14 px-5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="relative group lg:col-span-2">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Region / City</p>
                                        <input
                                            type="text"
                                            value={formData.address?.city || ""}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, city: e.target.value } })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg font-bold text-xs text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">State/Prov</p>
                                        <input
                                            type="text"
                                            value={formData.address?.state || ""}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, state: e.target.value } })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg font-bold text-xs text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Postal Code</p>
                                        <input
                                            type="text"
                                            value={formData.address?.zipCode || ""}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, zipCode: e.target.value } })}
                                            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg font-bold text-xs text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1 italic">Sovereign Nation (Country)</p>
                                    <input
                                        type="text"
                                        value={formData.address?.country || ""}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, country: e.target.value } })}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-lg font-bold text-xs text-gray-900 focus:bg-white focus:border-black transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Info Area */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-black text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-10">
                                <Building2 size={100} className="text-[#CBFF38]" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-7 rounded-lg bg-[#CBFF38] flex items-center justify-center text-black">
                                        <Info size={14} />
                                    </div>
                                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">Registry Status</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 italic">Operations</span>
                                        <span className="text-[9px] font-black text-[#CBFF38] uppercase italic">Standard</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 italic">Data Sync</span>
                                        <span className="text-[9px] font-black text-[#CBFF38] uppercase italic">100% Verified</span>
                                    </div>
                                </div>

                                <p className="text-[9px] font-bold text-gray-600 mt-6 leading-relaxed italic uppercase opacity-60">
                                    Identity changes undergo validation protocol verification.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group cursor-pointer hover:bg-black hover:text-[#CBFF38] transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[9px] font-black uppercase tracking-widest italic text-gray-400 group-hover:text-white">Clinical Branding</h4>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform group-hover:text-[#CBFF38]" />
                            </div>
                            <p className="text-[10px] font-bold leading-tight uppercase italic text-gray-600 group-hover:text-gray-400 opacity-70">
                                Manage clinical logos and brand assets.
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm italic">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">Security Access</h4>
                            <button type="button" className="w-full py-4 bg-gray-50 border border-gray-100 rounded-xl font-black uppercase text-[9px] tracking-widest text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                                Rotate API Keys
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
