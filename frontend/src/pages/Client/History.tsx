import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppointmentCard } from "@/components/molecules/AppointmentCard";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const History: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Appointment History</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments
            .filter((a: Appointment) => a.status === "completed")
            .map((appointment: Appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
        </div>
      </div>
    </div>
  );
};
