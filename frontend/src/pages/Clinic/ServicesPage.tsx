import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchServices } from "../../store/slices/clinicSlice";
import clinicApi from "../../services/api/clinicApi";
import { hasPermission } from "../../utils/rolePermissions";
import { Service, CreateServiceDto } from "../../types/clinic.types";
import {
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Settings,
  X,
} from "lucide-react";

const ServicesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { services, isLoading } = useSelector(
    (state: RootState) => state.clinic
  );
  const user = useSelector((state: RootState) => state.auth.user);

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    dispatch(fetchServices(undefined));
  }, [dispatch]);

  const handleToggleStatus = async (id: string) => {
    try {
      await clinicApi.services.toggleStatus(id);
      dispatch(fetchServices(undefined));
    } catch (error) {
      console.error("Failed to toggle service status:", error);
    }
  };

  const canManage = hasPermission(user?.role, "canManageServices");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Minimal Header */}
      <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                <div className="size-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Catalog Management</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Treatments & Pricing</h1>
                <p className="text-gray-500 font-medium max-w-md text-sm">Orchestrate clinical offerings and deployment protocol.</p>
              </div>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowModal(true);
                }}
                className="group h-12 px-8 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all shadow-lg flex items-center gap-3"
              >
                <Plus size={16} />
                Provision New Therapy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="size-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Processing Registry...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
            <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-200">
              <Settings size={28} />
            </div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-900 mb-2">Registry Offline</h3>
            <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-widest">No therapies provisioned yet.</p>
            {canManage && (
              <button
                onClick={() => setShowModal(true)}
                className="h-12 px-8 bg-black text-[#CBFF38] rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
              >
                Provision Therapy
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                canManage={canManage}
                onToggle={() => handleToggleStatus(service.id)}
                onEdit={() => {
                  setEditingService(service);
                  setShowModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Service Modal */}
      {showModal && (
        <ServiceModal
          service={editingService}
          onClose={() => {
            setShowModal(false);
            setEditingService(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingService(null);
            dispatch(fetchServices(undefined));
          }}
        />
      )}
    </div>
  );
};

/* --- Helper Components --- */

const ServiceCard = ({ service, canManage, onToggle, onEdit }: any) => {
  const isActive = service.isActive;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden group flex flex-col ${isActive ? 'border-gray-50 shadow-sm hover:border-black hover:shadow-lg' : 'border-gray-50 grayscale opacity-60'
      }`}>
      {/* Visual Layer */}
      <div className="h-40 relative overflow-hidden bg-gray-50">
        {service.treatment?.imageUrl ? (
          <img
            src={service.treatment.imageUrl}
            alt={service.treatment?.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200">
            <Settings size={48} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-black/80 text-[#CBFF38] text-[8px] font-black uppercase tracking-[0.2em] rounded-lg">
            {service.treatment?.category || 'Clinical'}
          </span>
        </div>
        {canManage && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="absolute top-3 right-3 size-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg hover:bg-[#CBFF38] transition-all"
          >
            {isActive ? <ToggleRight className="text-black" size={16} /> : <ToggleLeft className="text-gray-400" size={16} />}
          </button>
        )}
      </div>

      {/* Content Layer */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-900 leading-none group-hover:translate-x-1 transition-transform mb-1.5">{service.treatment?.name}</h3>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 italic">Deploy v4.0</p>
          </div>

          <p className="text-gray-500 text-[11px] font-medium line-clamp-2 leading-tight italic">
            {service.treatment?.shortDescription || "Premium medical aesthetic procedure matrix."}
          </p>

          <div className="flex items-center gap-4 py-3 border-y border-gray-50/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock size={12} className="text-gray-300" />
              <span className="text-[10px] font-black text-gray-900 italic uppercase">{service.durationMinutes}m</span>
            </div>
            <div className="text-lg font-black tracking-tighter text-gray-900 italic">
              €{service.price}
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={onEdit}
            className="mt-4 w-full h-10 bg-gray-50 hover:bg-black hover:text-[#CBFF38] rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest italic"
          >
            <Edit2 size={12} />
            Parameters
          </button>
        )}
      </div>
    </div>
  );
};

// Service Modal Component
interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  service,
  onClose,
  onSave,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [manualCategoryName, setManualCategoryName] = useState("");

  const [formData, setFormData] = useState<CreateServiceDto>({
    treatmentId: service?.treatmentId || "",
    name: service?.treatment?.name || "",
    shortDescription: service?.treatment?.shortDescription || "",
    fullDescription: service?.treatment?.fullDescription || "",
    price: service?.price || 0,
    durationMinutes: service?.durationMinutes || 60,
    category: service?.treatment?.category || "",
    imageUrl: service?.treatment?.imageUrl || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== "manual_cat") {
      fetchTreatments(selectedCategoryId);
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (cat) setFormData((prev) => ({ ...prev, category: cat.name }));
    } else if (selectedCategoryId === "manual_cat") {
      setTreatments([]);
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      const cats = await clinicApi.services.getCategories();
      setCategories(cats);
      if (service?.treatment?.categoryId) {
        setSelectedCategoryId(service.treatment.categoryId);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchTreatments = async (catId: string) => {
    try {
      const ts = await clinicApi.services.getTreatmentsByCategory(catId);
      setTreatments(ts);
      if (service?.treatmentId) {
        setSelectedTreatmentId(service.treatmentId);
      }
    } catch (err) {
      console.error("Failed to fetch treatments", err);
    }
  };

  const handleTreatmentChange = (tId: string) => {
    setSelectedTreatmentId(tId);
    if (tId === "manual") {
      setIsManualEntry(true);
      setFormData((prev) => ({
        ...prev,
        treatmentId: "",
        name: "",
        shortDescription: "",
        fullDescription: "",
      }));
    } else {
      setIsManualEntry(false);
      const t = treatments.find((item) => item.id === tId);
      if (t) {
        setFormData((prev) => ({
          ...prev,
          treatmentId: t.id,
          name: t.name,
          shortDescription: t.shortDescription,
          fullDescription: t.fullDescription,
          imageUrl: t.imageUrl || prev.imageUrl,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalTreatmentId = selectedTreatmentId;
      let finalCategoryId = selectedCategoryId;

      if (isManualCategory) {
        const manualC = await clinicApi.services.createManualCategory({
          name: manualCategoryName,
        });
        finalCategoryId = manualC.id;
      }

      if (isManualEntry || (selectedTreatmentId === "manual")) {
        // Create manual treatment first
        const manualT = await clinicApi.services.createManualTreatment({
          name: formData.name || "",
          categoryId: finalCategoryId,
          shortDescription: formData.shortDescription,
          fullDescription: formData.fullDescription,
        });
        finalTreatmentId = manualT.id;
      }

      const payload = {
        ...formData,
        treatmentId: finalTreatmentId,
      };

      if (service) {
        await clinicApi.services.update(service.id, payload);
      } else {
        await clinicApi.services.create(payload);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save service:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-t-8 border-blue-600">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {service ? "Edit Service" : "Add New Service"}
            </h2>
            <p className="text-sm text-gray-500">Configure your treatment offering</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-6 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-tighter italic">Selection Workflow</h3>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">1. Professional Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategoryId(val);
                  if (val === "manual_cat") {
                    setIsManualCategory(true);
                    setSelectedTreatmentId("manual");
                    setIsManualEntry(true);
                    setFormData(prev => ({
                      ...prev,
                      treatmentId: "",
                      name: "",
                      shortDescription: "",
                      fullDescription: ""
                    }));
                  } else {
                    setIsManualCategory(false);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white font-bold text-gray-800 shadow-sm transition-all"
                required
              >
                <option value="">Select Medical Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="manual_cat" className="font-bold text-blue-600">+ Add New Category (Needs Approval)</option>
              </select>
            </div>

            {isManualCategory && (
              <div className="space-y-1.5 animate-in fade-in duration-300 relative">
                <div className="absolute -left-3 top-1/2 -mt-px w-2 h-0.5 bg-blue-300"></div>
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">New Category Name</label>
                <input
                  type="text"
                  value={manualCategoryName}
                  onChange={(e) => setManualCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none bg-blue-50/30 font-bold"
                  required
                  placeholder="e.g. Advanced Laser Types..."
                />
              </div>
            )}

            {/* Treatment Dropdown (Show context even if disabled) */}
            <div className={`space-y-1.5 transition-all duration-300 ${(!selectedCategoryId || isManualCategory) ? 'opacity-50' : 'opacity-100'}`}>
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">2. Specific Therapy Name</label>
              <select
                value={selectedTreatmentId}
                onChange={(e) => handleTreatmentChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white font-bold text-gray-800 shadow-sm transition-all italic"
                disabled={!selectedCategoryId || isManualCategory}
                required
              >
                <option value="">{selectedCategoryId ? 'Choose Treatment...' : '--- Select Category First ---'}</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="manual" className="font-bold text-blue-600">+ Add Custom Therapy (Needs Approval)</option>
              </select>
            </div>
          </div>

          {(isManualEntry || (selectedTreatmentId === "manual")) && (
            <div className="space-y-4 p-5 bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-200 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 mb-2 text-amber-800 font-black text-[10px] uppercase tracking-widest">
                <ToggleLeft className="w-4 h-4" />
                <span>Manual Therapy Request</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Proposed Therapy Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white rounded-lg focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none bg-white font-medium"
                  required
                  placeholder="e.g. Advanced Bio-Filler"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Short Preview</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white rounded-lg focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none bg-white font-medium"
                  placeholder="Brief 1-sentence summary..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Complete Details</label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-white rounded-lg focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none bg-white resize-none font-medium"
                  placeholder="Tell admin about this treatment..."
                />
              </div>
            </div>
          )}

          {/* Price & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pricing (€)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-100 rounded-xl focus:ring-4 focus:ring-gray-50 focus:border-gray-300 outline-none font-black text-xl text-gray-900"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time (MIN)</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">Min</span>
                <input
                  type="number"
                  min="1"
                  value={formData.durationMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:ring-4 focus:ring-gray-50 focus:border-gray-300 outline-none font-black text-xl text-gray-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Representation Image URL</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:ring-4 focus:ring-gray-50 focus:border-gray-300 outline-none text-sm text-blue-600 underline"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all font-black uppercase text-xs tracking-widest border border-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] h-14 bg-[#CBFF38] text-gray-900 rounded-2xl hover:bg-lime-300 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-lime-100 disabled:opacity-50 disabled:grayscale"
              disabled={
                isSubmitting ||
                (!selectedCategoryId && !isManualCategory) ||
                (isManualCategory && !manualCategoryName) ||
                ((isManualEntry || selectedTreatmentId === "manual") && !formData.name) ||
                (selectedCategoryId && selectedCategoryId !== "manual_cat" && !selectedTreatmentId)
              }
            >
              {isSubmitting ? "Syncing..." : (service ? "Update Service Offer" : ((isManualEntry || isManualCategory) ? "Submit Request" : "Publish Online Service"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesPage;
