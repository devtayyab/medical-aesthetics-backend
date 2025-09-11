import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppointmentCard } from "@/components/molecules/AppointmentCard";
import {
  fetchUserAppointments,
  reschedule,
  cancel,
} from "@/store/slices/clientSlice";
import { Sidebar } from "@/components/organisms/Sidebar";
import type { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";

export const Appointments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  const handleCancel = (id: string) => {
    dispatch(cancel(id));
  };

  const handleReschedule = (id: string) => {
    const appointment = appointments.find((appt) => appt.id === id);
    if (appointment) {
      navigate(
        `/appointment/booking?clinicId=${appointment.clinicId}&serviceId=${appointment.serviceId}&appointmentId=${id}`
      );
    }
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">My Appointments</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appointment: Appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancel}
              onReschedule={handleReschedule}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
