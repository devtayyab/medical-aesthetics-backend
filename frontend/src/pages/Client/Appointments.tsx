import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserAppointments } from "@/store/slices/bookingSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import type { Appointment } from "@/types";

export const Appointments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    appointments: bookingAppointments,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.booking);
  const { appointments: clientAppointments } = useSelector(
    (state: RootState) => state.client
  ); // Access dummy appointments

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  // Combine dummy data with fetched data (prioritize fetched data)
  const appointments =
    bookingAppointments.length > 0 ? bookingAppointments : clientAppointments;

  if (isLoading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">No appointments found.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((apt: Appointment) => (
            <li key={apt.id} className="p-4 border rounded shadow">
              <p className="font-medium">
                <strong>Clinic:</strong> {apt.clinic?.name || "N/A"}
              </p>
              <p>
                <strong>Service:</strong> {apt.service?.name || "N/A"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(apt.startTime).toLocaleString()} -{" "}
                {new Date(apt.endTime).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {apt.status}
              </p>
              <p>
                <strong>Notes:</strong> {apt.notes || "None"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
