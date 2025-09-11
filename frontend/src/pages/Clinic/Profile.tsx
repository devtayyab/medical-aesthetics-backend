import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import {
  fetchClinicProfile,
  updateClinicProfile,
} from "@/store/slices/clinicSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );
  const [form, setForm] = useState<Partial<Clinic>>({});

  useEffect(() => {
    dispatch(fetchClinicProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setForm(profile);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateClinicProfile(form));
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Clinic Profile</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="name"
            placeholder="Clinic Name"
            value={form.name || ""}
            onChange={handleChange}
            fullWidth
          />
          <Input
            name="description"
            placeholder="Description"
            value={form.description || ""}
            onChange={handleChange}
            fullWidth
          />
          <Input
            name="address"
            placeholder="Address"
            value={form.address || ""}
            onChange={handleChange}
            fullWidth
          />
          <Input
            name="phone"
            placeholder="Phone"
            value={form.phone || ""}
            onChange={handleChange}
            fullWidth
          />
          <Input
            name="email"
            placeholder="Email"
            value={form.email || ""}
            onChange={handleChange}
            fullWidth
          />
          <Button type="submit">Save Profile</Button>
        </form>
      </div>
    </div>
  );
};
