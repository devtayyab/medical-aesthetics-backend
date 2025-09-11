import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarView } from "@/components/organisms/CalendarView";
import { fetchClinicAppointments } from "@/store/slices/clinicSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Diary: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    dispatch(fetchClinicAppointments());
  }, [dispatch]);

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Appointment Diary</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <CalendarView
          appointments={appointments}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>
    </div>
  );
};
