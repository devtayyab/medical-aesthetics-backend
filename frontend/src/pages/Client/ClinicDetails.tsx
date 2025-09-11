import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import {
  fetchClinicById,
  fetchClinicServices,
} from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic, Service } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedClinic, services, isLoading, error } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchClinicById(id));
      dispatch(fetchClinicServices(id));
    }
  }, [dispatch, id]);

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Clinic Details</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {selectedClinic && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">{selectedClinic.name}</h3>
            <p>{selectedClinic.description}</p>
            <p>Address: {selectedClinic.address}</p>
            <p>Phone: {selectedClinic.phone}</p>
            <p>Email: {selectedClinic.email}</p>
            <h4 className="text-lg font-semibold">Services</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service: Service) => (
                <div key={service.id} className="p-2 border rounded">
                  <p>{service.name}</p>
                  <p>${service.price}</p>
                  <Button
                    onClick={() =>
                      navigate(
                        `/appointment/booking?clinicId=${id}&serviceId=${service.id}`
                      )
                    }
                  >
                    Book Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
