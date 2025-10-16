import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClinicProfile } from "@/store/slices/clinicSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";

export const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  useEffect(() => {
    dispatch(fetchClinicProfile());
  }, [dispatch]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Clinic Profile</h2>
      <p>
        <strong>Name:</strong> {profile.name}
      </p>
      <p>
        <strong>Description:</strong> {profile.description}
      </p>
      <p>
        <strong>Address:</strong> {profile.address?.street},{" "}
        {profile.address?.city}, {profile.address?.state}{" "}
        {profile.address?.zipCode}
      </p>
      <p>
        <strong>Phone:</strong> {profile.phone}
      </p>
      <p>
        <strong>Email:</strong> {profile.email}
      </p>
    </div>
  );
};
