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
  const [formData, setFormData] = useState<CreateServiceDto>({
    name: service?.treatment?.name || "",
    shortDescription: service?.treatment?.shortDescription || "",
    fullDescription: service?.treatment?.fullDescription || "",
    price: service?.price || 0,
    durationMinutes: service?.durationMinutes || 60,
    category: service?.treatment?.category || "Other",
    imageUrl: service?.treatment?.imageUrl || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.category) {
        alert("Please select a treatment category.");
        setIsSubmitting(false);
        return;
      }

      if (service) {
        await clinicApi.services.update(service.id, formData);
      } else {
        await clinicApi.services.create(formData);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {service ? "Edit Service" : "Add New Service"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description (1-2 lines) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                placeholder="Brief summary for treatment cards"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.fullDescription}
                onChange={(e) =>
                  setFormData({ ...formData, fullDescription: e.target.value })
                }
                rows={4}
                placeholder="Comprehensive details shown on the detail page"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (min) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.durationMinutes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: e.target.value === "" ? 0 : parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                <option value="Hair Removal">Hair Removal</option>
                <option value="Injectables">Injectables</option>
                <option value="Skin Care">Skin Care</option>
                <option value="Body">Body</option>
                <option value="Surgery">Surgery</option>
                <option value="Dental">Dental</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Required to Publish) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img src={formData.imageUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-200" />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !formData.category}
            >
              {isSubmitting
                ? "Saving..."
                : service
                  ? "Update Service"
                  : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesPage;
