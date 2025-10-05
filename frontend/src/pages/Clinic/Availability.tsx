import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { updateAvailability } from "@/store/slices/clinicSlice";
import { RootState, AppDispatch } from "@/store";

export const Availability: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { availability, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>(
    []
  );

  const handleUpdateAvailability = () => {
    if (date && slots.length > 0) {
      dispatch(updateAvailability({ date, slots })).unwrap();
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Availability</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4"
      />
      {/* Add slot input fields dynamically */}
      <div className="mb-4">
        {slots.map((slot, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <Input
              type="time"
              value={slot.startTime}
              onChange={(e) => {
                const newSlots = [...slots];
                newSlots[index].startTime = e.target.value;
                setSlots(newSlots);
              }}
            />
            <Input
              type="time"
              value={slot.endTime}
              onChange={(e) => {
                const newSlots = [...slots];
                newSlots[index].endTime = e.target.value;
                setSlots(newSlots);
              }}
            />
            <Button
              onClick={() => setSlots(slots.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          onClick={() => setSlots([...slots, { startTime: "", endTime: "" }])}
        >
          Add Slot
        </Button>
      </div>
      <Button onClick={handleUpdateAvailability} disabled={isLoading}>
        Update Availability
      </Button>
      {availability?.length > 0 && (
        <div className="mt-4">
          <h3>Current Availability</h3>
          <ul>
            {availability.map((slot, index) => (
              <li key={index}>
                {slot.startTime} - {slot.endTime}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
