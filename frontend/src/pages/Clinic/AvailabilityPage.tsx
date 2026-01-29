import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  fetchAvailability,
  updateAvailability,
  fetchBlockedSlots,
  blockTimeSlot,
  unblockTimeSlot,
} from "../../store/slices/clinicSlice";
import { AvailabilitySettings, BusinessHours, BlockedSlot } from "../../types/clinic.types";
import { Clock, Save, Calendar, Plus, Trash2 } from "lucide-react";

const AvailabilityPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { availability, isLoading } = useSelector(
    (state: RootState) => state.clinic
  );

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: "09:00", close: "17:00", isOpen: true },
    tuesday: { open: "09:00", close: "17:00", isOpen: true },
    wednesday: { open: "09:00", close: "17:00", isOpen: true },
    thursday: { open: "09:00", close: "17:00", isOpen: true },
    friday: { open: "09:00", close: "17:00", isOpen: true },
    saturday: { open: "10:00", close: "15:00", isOpen: true },
    sunday: { open: "10:00", close: "15:00", isOpen: false },
  });


  // We'll store the full entity or a mapped version that includes ID for deletion
  const [blockedDates, setBlockedDates] = useState<{ id: string; date: string }[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<{ id: string; result: BlockedSlot }[]>([]);

  // Form states

  // Form states
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newSlot, setNewSlot] = useState({ date: "", startTime: "09:00", endTime: "10:00" });

  const [timezone, setTimezone] = useState("America/New_York");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAvailability());
    loadBlockedSlots();
  }, [dispatch]);

  const loadBlockedSlots = async () => {
    try {
      const result = await dispatch(fetchBlockedSlots()).unwrap();
      // Separate full day blocks vs partial
      // Assumption: Full day blocks start at 00:00 and end at 23:59 (or next day 00:00)
      const dates: { id: string; date: string }[] = [];
      const slots: { id: string; result: BlockedSlot }[] = [];

      result.forEach((slot: any) => {
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const isFullDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() === 59;

        if (isFullDay) {
          dates.push({ id: slot.id, date: slot.startTime });
        } else {
          slots.push({
            id: slot.id,
            result: {
              date: slot.startTime,
              startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
              note: slot.reason
            }
          });
        }
      });
      setBlockedDates(dates);
      setBlockedSlots(slots);
    } catch (err) {
      console.error("Failed to load blocked slots", err);
    }
  };

  useEffect(() => {
    if (availability) {
      setBusinessHours(
        availability.businessHours ?? {
          monday: { open: "09:00", close: "17:00", isOpen: true },
          tuesday: { open: "09:00", close: "17:00", isOpen: true },
          wednesday: { open: "09:00", close: "17:00", isOpen: true },
          thursday: { open: "09:00", close: "17:00", isOpen: true },
          friday: { open: "09:00", close: "17:00", isOpen: true },
          saturday: { open: "10:00", close: "15:00", isOpen: true },
          sunday: { open: "10:00", close: "15:00", isOpen: false },
        }
      );
      setTimezone(availability.timezone || "America/New_York");
    }
  }, [availability]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only update business hours and timezone here
      const payload: Partial<AvailabilitySettings> = {
        businessHours,
        timezone,
      };

      await dispatch(
        updateAvailability(payload as AvailabilitySettings)
      ).unwrap();
      alert("Availability settings saved successfully!");
    } catch (error) {
      console.error("Failed to save availability:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDayHours = (
    day: string,
    field: "open" | "close" | "isOpen",
    value: any
  ) => {
    setBusinessHours({
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [field]: value,
      },
    });
  };

  const addBlockedDate = async () => {
    if (newBlockedDate) {
      // Check for dups? For now let's just add.
      // Full day block: 00:00 to 23:59:59
      const start = new Date(newBlockedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(newBlockedDate);
      end.setHours(23, 59, 59, 999);

      try {
        await dispatch(blockTimeSlot({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: 'Full Day Block'
        })).unwrap();
        setNewBlockedDate("");
        loadBlockedSlots(); // Reload to get IDs
      } catch (err) {
        alert("Failed to block date");
      }
    }
  };

  const removeBlockedDate = async (id: string) => {
    try {
      await dispatch(unblockTimeSlot(id)).unwrap();
      loadBlockedSlots();
    } catch (e) {
      alert("Failed to unblock date");
    }
  };

  const addBlockedSlot = async () => {
    if (newSlot.date && newSlot.startTime && newSlot.endTime) {
      const start = new Date(`${newSlot.date}T${newSlot.startTime}`);
      const end = new Date(`${newSlot.date}T${newSlot.endTime}`);

      try {
        await dispatch(blockTimeSlot({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: 'Partial Block'
        })).unwrap();
        setNewSlot({ ...newSlot, date: "" });
        loadBlockedSlots();
      } catch (err) {
        alert("Failed to block slot");
      }
    }
  };

  const removeBlockedSlot = async (id: string) => {
    try {
      await dispatch(unblockTimeSlot(id)).unwrap();
      loadBlockedSlots();
    } catch (e) {
      alert("Failed to unblock slot");
    }
  };

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Availability Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your clinic's working hours and blocked dates
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Hours */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Business Hours
          </h2>
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-4">
                {/* Day Name */}
                <div className="w-32">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={businessHours[day]?.isOpen || false}
                      onChange={(e) =>
                        updateDayHours(day, "isOpen", e.target.checked)
                      }
                      className="w-4 h-4 text-[#CBFF38] rounded focus:ring-lime-300"
                    />
                    <span className="font-medium text-gray-900 capitalize">
                      {day}
                    </span>
                  </label>
                </div>

                {/* Time Inputs */}
                {businessHours[day]?.isOpen ? (
                  <>
                    <input
                      type="time"
                      value={businessHours[day]?.open || "09:00"}
                      onChange={(e) =>
                        updateDayHours(day, "open", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={businessHours[day]?.close || "17:00"}
                      onChange={(e) =>
                        updateDayHours(day, "close", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </>
                ) : (
                  <span className="text-gray-400 italic">Closed</span>
                )}
              </div>
            ))}
          </div>

          {/* Timezone */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
            </select>
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Blocked Dates
          </h2>

          {/* Add Blocked Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Blocked Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-300 outline-none"
              />
              <button
                type="button"
                onClick={addBlockedDate}
                className="px-4 py-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Blocked Dates List */}
          <div className="space-y-2">
            {blockedDates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No blocked dates
              </p>
            ) : (
              blockedDates.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(item.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })} (Full Day)
                  </span>
                  <button
                    onClick={() => removeBlockedDate(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Hours (Partial Day) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Blocked Hours
          </h2>
          <p className="text-sm text-gray-500 mb-4">Block specific time ranges for a doctor.</p>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-300 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-300 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lime-300 outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addBlockedSlot}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> Add Blocked Time
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {blockedSlots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 italic">No blocked hours.</p>
            ) : (
              blockedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {new Date(slot.result.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {slot.result.startTime} - {slot.result.endTime}
                    </div>
                  </div>
                  <button
                    onClick={() => removeBlockedSlot(slot.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;
