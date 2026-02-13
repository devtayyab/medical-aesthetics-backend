import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { scheduleRecurring } from "@/store/slices/crmSlice";
import type { AppDispatch } from "@/store";
import { Select } from "@/components/atoms/Select/Select";
import { userAPI } from "@/services/api";

export const RepeatManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({
    customerId: "",
    serviceId: "",
    frequency: "",
    startDate: "",
  });
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await userAPI.getAllUsers({ role: 'client' });
        // Assuming response.data is an array of users or has a users property
        const users = Array.isArray(response.data) ? response.data : response.data.users || [];

        const customerOptions = users.map((user: any) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email || 'No email'})`,
        }));
        setCustomers(customerOptions);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };

    fetchCustomers();
  }, []);

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

        <Select
          label="Customer"
          placeholder="Select Customer"
          value={form.customerId}
          onChange={(val) => handleSelectChange('customerId', val)}
          options={customers}
          required
        />

        <Input
          name="serviceId"
          placeholder="Service ID"
          value={form.serviceId}
          onChange={handleChange}
          fullWidth
          required
        />
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
