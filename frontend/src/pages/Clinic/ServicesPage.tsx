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
  DollarSign,
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
    dispatch(fetchServices());
  }, [dispatch]);

  const handleToggleStatus = async (id: string) => {
    try {
      await clinicApi.services.toggleStatus(id);
      dispatch(fetchServices());
    } catch (error) {
      console.error("Failed to toggle service status:", error);
    }
  };

  const canManage = hasPermission(user?.role, "canManageServices");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            className="flex items-center gap-2 px-4 py-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors"
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
              className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 ${
                !service.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  {service.category && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {service.category}
                    </span>
                  )}
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

              {/* Description */}
              {service.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

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
            dispatch(fetchServices());
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
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || 0,
    durationMinutes: service?.durationMinutes || 60,
    category: service?.category || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
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
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: parseInt(e.target.value),
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
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g., Botox, Fillers, Skin Care"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              className="flex-1 px-6 py-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
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
