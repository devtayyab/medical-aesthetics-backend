import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { scheduleRecurring, getCustomerRecord, clearCustomerRecord } from "@/store/slices/crmSlice";
import type { AppDispatch, RootState } from "@/store";
import { Select } from "@/components/atoms/Select/Select";
import { userAPI, crmAPI, clinicsAPI } from "@/services/api";
import { useSelector } from "react-redux";
import { User, Calendar, Clock, RotateCcw, Building } from "lucide-react";

export const RepeatManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { customerRecord, isLoading } = useSelector((state: RootState) => state.crm);
  const [form, setForm] = useState({
    customerId: "",
    serviceId: "",
    frequency: "",
    startDate: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [clinics, setClinics] = useState<{ value: string; label: string }[]>([]);
  const [services, setServices] = useState<{ value: string; label: string }[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Customers
        const userRes = await userAPI.getAllUsers({ role: 'client' });
        const users = Array.isArray(userRes.data) ? userRes.data : userRes.data.users || [];
        setCustomers(users.map((user: any) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email || 'No email'})`
        })));

        // Fetch Clinics
        const clinicRes = await crmAPI.getAccessibleClinics();
        const clinicList = Array.isArray(clinicRes.data) ? clinicRes.data : [];
        setClinics(clinicList.map((clinic: any) => ({
          value: clinic.id,
          label: clinic.name
        })));
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };

    fetchData();
  }, []);

  const handleClinicChange = async (clinicId: string) => {
    setSelectedClinicId(clinicId);
    setForm({ ...form, serviceId: "" }); // Reset service when clinic changes

    if (!clinicId) {
      setServices([]);
      return;
    }

    try {
      const response = await clinicsAPI.getServices(clinicId);
      const serviceList = Array.isArray(response.data) ? response.data : [];
      setServices(serviceList.map((service: any) => ({
        value: service.id,
        label: `${service.name} ($${service.price})`
      })));
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setServices([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.customerId || !form.serviceId || !form.frequency) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await dispatch(scheduleRecurring(form)).unwrap();
      setSuccess("Recurring appointment scheduled successfully!");
      setForm({
        customerId: "",
        serviceId: "",
        frequency: "",
        startDate: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to schedule recurring appointment.");
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">
        Schedule Recurring Appointments
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Customer</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Customer Email or Name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              fullWidth
            />
            <Button
              type="button"
              onClick={() => {
                const customer = customers.find(c => c.label.toLowerCase().includes(inputValue.toLowerCase()));
                if (customer) {
                  setForm({ ...form, customerId: customer.value });
                  setInputValue(customer.label);
                  setSearchError(null);
                  dispatch(getCustomerRecord(customer.value));
                } else {
                  setSearchError("Customer not found");
                  setForm({ ...form, customerId: "" });
                  dispatch(clearCustomerRecord());
                }
              }}
              disabled={!inputValue || isLoading}
            >
              {isLoading ? "Loading..." : "Find"}
            </Button>
          </div>
          {searchError && <p className="text-sm text-red-500">{searchError}</p>}
        </div>

        {/* Customer Info Card */}
        {form.customerId && customerRecord && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              Customer Verified
            </h3>

            {(() => {
              // Compute real-time stats from the appointments array if available
              const appointments = customerRecord.appointments || [];
              const totalVisits = appointments.length;
              const hasVisits = totalVisits > 0;

              // Find the last visit date
              let lastVisitDate = null;
              if (hasVisits) {
                // Sort by date (descending) just in case, or use max
                const dates = appointments.map(a => new Date(a.startTime).getTime());
                const maxDate = Math.max(...dates);
                lastVisitDate = new Date(maxDate);
              }

              const isRepeat = totalVisits > 1;

              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Status
                    </p>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${isRepeat
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                      }`}>
                      {isRepeat ? 'Repeat Customer' : 'New Customer'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Total Visits
                    </p>
                    <p className="font-medium text-gray-900">{totalVisits}</p>
                  </div>

                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-gray-500 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last Visit
                    </p>
                    <p className="font-medium text-gray-900">
                      {lastVisitDate
                        ? lastVisitDate.toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p className="text-gray-500 mb-1">Assigned To</p>
                    <p className="font-medium text-gray-900">
                      {customerRecord.record.assignedSalesperson?.firstName
                        ? `${customerRecord.record.assignedSalesperson.firstName} ${customerRecord.record.assignedSalesperson.lastName}`
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Past Appointments List */}
        {form.customerId && customerRecord && (
          <div className="bg-white border boundary-gray-200 rounded-lg overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 delay-100">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Previous Appointments
              </h3>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {customerRecord.appointments?.length || 0} Records
              </span>
            </div>

            {customerRecord.appointments && customerRecord.appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Clinic</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerRecord.appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900">
                          {new Date(apt.startTime).toLocaleDateString()}
                          <span className="text-gray-400 text-xs ml-2">
                            {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {apt.serviceName || 'Unknown Service'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {apt.clinicName || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${apt.status === 'completed' ? 'bg-green-50 text-green-700' :
                            apt.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                              apt.status === 'no_show' ? 'bg-orange-50 text-orange-700' :
                                'bg-blue-50 text-blue-700'
                            }`}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {apt.totalAmount ? `$${Number(apt.totalAmount).toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No previous appointments found for this customer.</p>
              </div>
            )}
          </div>
        )}

        {/* Clinic & Service Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Clinic"
            placeholder="Select Clinic"
            value={selectedClinicId}
            onChange={handleClinicChange}
            options={clinics}
            required
          />
          <Select
            label="Service"
            placeholder={selectedClinicId ? "Select Service" : "Select Clinic First"}
            value={form.serviceId}
            onChange={(val) => handleSelectChange('serviceId', val)}
            options={services}
            disabled={!selectedClinicId}
            required
          />
        </div>
        <Select
          value={form.frequency}
          onChange={(val) => handleSelectChange('frequency', val)}
          label="Frequency"
          placeholder="Select frequency"
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
          ]}
          required
        />
        <Input
          name="startDate"
          type="date"
          value={form.startDate}
          onChange={handleChange}
          fullWidth
        />
        <Button type="submit">Schedule</Button>
      </form>
    </>
  );
};
