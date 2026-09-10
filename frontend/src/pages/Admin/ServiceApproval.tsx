import React, { useEffect, useState } from "react";
import clinicApi from "@/services/api/clinicApi";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Check, X, Building2, Tag, AlertCircle } from "lucide-react";

export const ServiceApproval: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingServices = async () => {
    try {
      setIsLoading(true);
      const response = await clinicApi.services.getPendingServices();
      setServices(response || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch pending services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingServices();
  }, []);

  const handleSetStatus = async (serviceId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await clinicApi.services.setServiceApprovalStatus(serviceId, status);
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} service`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">
            Service Approvals
          </h1>
          <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mt-1">
            Review and approve new services added by clinics
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2 text-blue-700 self-start md:self-auto">
          <AlertCircle size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{services.length} Pending Requests</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold uppercase">
          {error}
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <Check className="mx-auto h-12 w-12 text-lime-500 mb-4" />
          <h3 className="text-xl font-black text-gray-900 uppercase">Clear Sky!</h3>
          <p className="text-gray-500 mt-2 uppercase text-xs font-bold tracking-widest">All clinic service proposals have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <Card key={service.id} className="p-0 overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                {/* Side Info */}
                <div className="md:w-72 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Building2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-gray-400">Clinic</p>
                        <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">
                          {service.clinic?.name || 'Unknown Clinic'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                        <Tag size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-gray-400">Category</p>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                          {service.treatment?.categoryRef?.name || service.treatment?.category || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase">Status: Pending Approval</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
                      {service.treatment?.name || 'Unknown Treatment'}
                    </h3>
                    <div className="flex gap-4 mb-4">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Price</span>
                        <span className="text-lg font-black text-gray-900">€{Number(service.price).toFixed(2)}</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Duration</span>
                        <span className="text-lg font-black text-gray-900">{service.durationMinutes} min</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Master Therapy Description</p>
                      <p className="text-gray-700 font-medium text-sm">{service.treatment?.shortDescription || 'No description available.'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <Button
                      onClick={() => handleSetStatus(service.id, 'APPROVED')}
                      className="flex-1 h-12 rounded-xl bg-[#CBFF38] text-black hover:bg-lime-400 font-black uppercase text-xs tracking-widest shadow-lg shadow-lime-100 border-none"
                    >
                      <Check className="mr-2" size={16} />
                      Confirm & Publish
                    </Button>
                    <Button
                      onClick={() => handleSetStatus(service.id, 'REJECTED')}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-2 border-gray-100 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all font-black uppercase text-xs tracking-widest"
                    >
                      <X className="mr-2" size={16} />
                      Reject Service
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
