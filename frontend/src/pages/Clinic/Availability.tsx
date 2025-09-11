import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { updateAvailability } from "@/store/slices/clinicSlice";
import type { AppDispatch } from "@/store";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Availability: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>(
    []
  );

  const handleAddSlot = () => {
    setSlots([...slots, { startTime: "", endTime: "" }]);
  };

  const handleSlotChange = (index: number, field: string, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateAvailability({ date, slots }));
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Set Availability</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
          />
          {slots.map((slot, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  handleSlotChange(index, "startTime", e.target.value)
                }
                placeholder="Start Time"
              />
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  handleSlotChange(index, "endTime", e.target.value)
                }
                placeholder="End Time"
              />
            </div>
          ))}
          <Button variant="outline" onClick={handleAddSlot}>
            Add Slot
          </Button>
          <Button type="submit">Save Availability</Button>
        </form>
      </div>
    </div>
  );
};
