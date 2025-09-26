import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClinicAppointments } from "@/store/slices/clinicSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";

export const Diary: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  useEffect(() => {
    dispatch(fetchClinicAppointments());
  }, [dispatch]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Clinic Diary</h2>
      {appointments.length === 0 ? (
        <p>No appointments scheduled.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((apt) => (
            <li key={apt.id} className="p-4 border rounded">
              <p>
                <strong>Client:</strong> {apt.client?.firstName}{" "}
                {apt.client?.lastName}
              </p>
              <p>
                <strong>Service:</strong> {apt.service?.name}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(apt.startTime).toLocaleString()} -{" "}
                {new Date(apt.endTime).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {apt.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
