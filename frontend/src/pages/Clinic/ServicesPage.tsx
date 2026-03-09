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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Services & Pricing
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your clinic's treatment menu and pricing
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingService(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        )}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          {/* <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" /> */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No services yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start by adding your first service or treatment
          </p>
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors"
            >
              Add Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 ${!service.isActive ? "opacity-60" : ""
                }`}
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex gap-3">
                    {service.treatment?.imageUrl && (
                      <img
                        src={service.treatment.imageUrl}
                        alt={service.treatment?.name}
                        className="size-12 rounded-lg object-cover border border-gray-100 shadow-sm"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {service.treatment?.name}
                      </h3>
                      {service.treatment?.category && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {service.treatment.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleToggleStatus(service.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {service.isActive ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                )}
              </div>

              {/* Descriptions */}
              <div className="space-y-2 mb-4">
                {service.treatment?.shortDescription && (
                  <p className="text-sm font-medium text-gray-800 line-clamp-1 italic">
                    {service.treatment.shortDescription}
                  </p>
                )}
                {service.treatment?.fullDescription && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {service.treatment.fullDescription}
                  </p>
                )}
              </div>

              {/* Price & Duration */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* <DollarSign className="w-4 h-4 text-gray-400" /> */}
                  <span className="text-xl font-bold text-gray-900">
                    ${service.price}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{service.durationMinutes} min</span>
                </div>
              </div>

              {/* Actions */}
              {canManage && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setShowModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pricing ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
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
