import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { scheduleRecurring } from "@/store/slices/crmSlice";
import type { AppDispatch } from "@/store";

export const RepeatManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({
    customerId: "",
    serviceId: "",
    frequency: "",
    startDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(scheduleRecurring(form));
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">
        Schedule Recurring Appointments
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          name="customerId"
          placeholder="Customer ID"
          value={form.customerId}
          onChange={handleChange}
          fullWidth
        />
        <Input
          name="serviceId"
          placeholder="Service ID"
          value={form.serviceId}
          onChange={handleChange}
          fullWidth
        />
        <Input
          name="frequency"
          placeholder="Frequency (e.g., weekly)"
          value={form.frequency}
          onChange={handleChange}
          fullWidth
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
