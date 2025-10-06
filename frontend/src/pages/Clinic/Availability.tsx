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

  const [selectedDay, setSelectedDay] = useState("monday");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [timezone, setTimezone] = useState("America/New_York");
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const handleAddBlockedDate = (date: string) => {
    if (date && !blockedDates.includes(date)) {
      setBlockedDates([...blockedDates, date]);
    }
  };

  const handleUpdateAvailability = () => {
    const payload = {
      businessHours: {
        [selectedDay]: {
          open: openTime,
          close: closeTime,
          isOpen,
        },
      },
      blockedDates,
      timezone,
    };

    dispatch(updateAvailability(payload)).unwrap();
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Availability</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Day</label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="monday">Monday</option>
          <option value="tuesday">Tuesday</option>
          <option value="wednesday">Wednesday</option>
          <option value="thursday">Thursday</option>
          <option value="friday">Friday</option>
          <option value="saturday">Saturday</option>
          <option value="sunday">Sunday</option>
        </select>
      </div>

      <div className="flex space-x-2 mb-4">
        <Input
          type="time"
          label="Open Time"
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
        />
        <Input
          type="time"
          label="Close Time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isOpen}
            onChange={(e) => setIsOpen(e.target.checked)}
          />
          <span>Clinic is Open</span>
        </label>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Timezone</label>
        <Input
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Blocked Dates</label>
        <Input
          type="date"
          onChange={(e) => handleAddBlockedDate(e.target.value)}
        />
        {blockedDates.length > 0 && (
          <ul className="mt-2 text-sm">
            {blockedDates.map((d, i) => (
              <li key={i} className="flex justify-between items-center">
                {d}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setBlockedDates(blockedDates.filter((x) => x !== d))
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button onClick={handleUpdateAvailability} disabled={isLoading}>
        Update Availability
      </Button>

      {availability && (
        <div className="mt-4">
          <h3 className="font-semibold">Current Settings</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
            {JSON.stringify(availability, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
