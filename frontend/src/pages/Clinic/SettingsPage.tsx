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
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Core Configuration</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Global Settings</h1>
                <p className="text-gray-400 font-medium max-w-md">Manage your clinic's digital identity, contact channels, and geographical parameters.</p>
              </div>
            </div>
            
            <button
              onClick={() => handleSubmit()}
              disabled={isSaving}
              className="group h-16 px-10 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-lime-500/10 flex items-center gap-4 disabled:opacity-20"
            >
              <Save size={18} className="group-hover:rotate-12 transition-transform" />
              {isSaving ? "Persisting..." : "Commit Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                  <Building2 size={22} />
                </div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Entity Profiling</h2>
              </div>

              <div className="space-y-8">
                <div className="relative group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Legal Identity *</p>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Clinic Name"
                    className="w-full h-16 px-6 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all"
                    required
                  />
                </div>

                <div className="relative group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Clinical Abstract / Biography</p>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief overview of your medical excellence..."
                    rows={4}
                    className="w-full p-6 bg-gray-50 border-none rounded-[32px] font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="relative group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Primary Voice Line *</p>
                    <div className="relative">
                       <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                       <input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-16 pl-14 pr-6 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Transmission Email *</p>
                    <div className="relative">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                       <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-16 pl-14 pr-6 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 relative group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Digital Domain (Website)</p>
                    <div className="relative">
                       <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                       <input
                        type="url"
                        value={formData.website || ""}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://www.aestheticsexcellence.com"
                        className="w-full h-16 pl-14 pr-6 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                  <MapPin size={22} />
                </div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Geographical Origin</h2>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Street Protocol Address</p>
                  <input
                    type="text"
                    value={formData.address?.street || ""}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, street: e.target.value } })}
                    className="w-full h-16 px-6 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-black transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative group lg:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Region / City</p>
                    <input
                      type="text"
                      value={formData.address?.city || ""}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, city: e.target.value } })}
                      className="w-full h-14 px-6 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">State/Prov</p>
                    <input
                      type="text"
                      value={formData.address?.state || ""}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, state: e.target.value } })}
                      className="w-full h-14 px-6 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="relative group">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Postal Code</p>
                    <input
                      type="text"
                      value={formData.address?.zipCode || ""}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, zipCode: e.target.value } })}
                      className="w-full h-14 px-6 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="relative group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 italic">Sovereign Nation (Country)</p>
                  <input
                    type="text"
                    value={formData.address?.country || ""}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address!, country: e.target.value } })}
                    className="w-full h-14 px-6 bg-gray-50 border-none rounded-xl font-bold text-gray-900 focus:ring-1 focus:ring-black transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Info Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                 <Building2 size={120} className="text-[#CBFF38]" />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="size-8 rounded-lg bg-[#CBFF38] flex items-center justify-center text-black">
                       <Info size={16} />
                    </div>
                    <h3 className="font-black uppercase italic tracking-tighter text-white">Registry Status</h3>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Operations</span>
                       <span className="text-[10px] font-black text-[#CBFF38] uppercase italic">Standard Mode</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Data Integrity</span>
                       <span className="text-[10px] font-black text-[#CBFF38] uppercase italic">100% Synced</span>
                    </div>
                 </div>

                 <p className="text-[10px] font-bold text-gray-500 mt-8 leading-relaxed italic">
                    Changes to primary identity parameters may affect patient trust vectors and search engine visibility protocols.
                 </p>
              </div>
            </div>

            <div className="bg-[#CBFF38] p-8 rounded-[40px] shadow-xl shadow-lime-500/10 group cursor-pointer hover:bg-black hover:text-[#CBFF38] transition-all">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest italic">Clinical Branding</h4>
                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </div>
               <p className="text-xs font-bold leading-tight uppercase italic opacity-70">
                 Upload high-fidelity clinical logos and brand assets for the patient portal.
               </p>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">Security Access</h4>
               <button type="button" className="w-full py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                  Rotate API Access Keys
               </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
