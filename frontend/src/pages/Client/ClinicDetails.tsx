import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  fetchClinicById,
  fetchClinicServices,
} from "@/store/slices/clinicsSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";

export const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedClinic, services, isLoading, error } = useSelector(
    (state: RootState) => state.clinics
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchClinicById(id));
      dispatch(fetchClinicServices(id));
    }
  }, [dispatch, id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!selectedClinic) return <div>Clinic not found.</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{selectedClinic.name}</h2>
      <p>
        <strong>Description:</strong> {selectedClinic.description}
      </p>
      <p>
        <strong>Address:</strong> {selectedClinic.address?.street},{" "}
        {selectedClinic.address?.city}, {selectedClinic.address?.state}{" "}
        {selectedClinic.address?.zipCode}
      </p>
      <h3 className="text-xl font-semibold mt-4">Services</h3>
      {services.length === 0 ? (
        <p>No services available.</p>
      ) : (
        <ul className="space-y-2">
          {services.map((service) => (
            <li key={service.id} className="p-2 border rounded">
              <p>
                <strong>Name:</strong> {service.name}
              </p>
              <p>
                <strong>Price:</strong> ${service.price}
              </p>
              <p>
                <strong>Duration:</strong> {service.durationMinutes} mins
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
