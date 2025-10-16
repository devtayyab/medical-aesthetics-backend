import React from "react";
import { format, addDays, subDays } from "date-fns";
import { Appointment } from "@/types";

interface CalendarViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateChange,
}) => {
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(selectedDate, i - 3)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button onClick={() => onDateChange(subDays(selectedDate, 7))}>
          Prev
        </button>
        <button onClick={() => onDateChange(addDays(selectedDate, 7))}>
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-2 text-center ${
              format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                ? "bg-[#CBFF38]"
                : "bg-gray-100"
            }`}
            onClick={() => onDateChange(day)}
          >
            {format(day, "MMM d")}
          </div>
        ))}
      </div>
      <div>
        {appointments
          .filter(
            (a) =>
              format(new Date(a.startTime), "yyyy-MM-dd") ===
              format(selectedDate, "yyyy-MM-dd")
          )
          .map((appointment) => (
            <div key={appointment.id} className="p-2 border-b">
              <p>{appointment.service.name}</p>
              <p>{new Date(appointment.startTime).toLocaleTimeString()}</p>
            </div>
          ))}
      </div>
    </div>
  );
};
