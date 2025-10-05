import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  fetchAvailability,
  updateAvailability,
} from "../../store/slices/clinicSlice";
import { AvailabilitySettings, BusinessHours } from "../../types/clinic.types";
import { Clock, Save, Calendar } from "lucide-react";

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

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAvailability());
  }, [dispatch]);

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
      setBlockedDates(availability.blockedDates || []);
      setTimezone(availability.timezone || "America/New_York");
    }
  }, [availability]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only include blockedDates if it's not empty to avoid validation issues with empty arrays
      const payload: Partial<AvailabilitySettings> = {
        businessHours,
        timezone,
      };
      if (blockedDates.length > 0) {
        payload.blockedDates = blockedDates;
      }

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

  const addBlockedDate = () => {
    if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
      setBlockedDates([...blockedDates, newBlockedDate]);
      setNewBlockedDate("");
    }
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== date));
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
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addBlockedDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              blockedDates.sort().map((date) => (
                <div
                  key={date}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => removeBlockedDate(date)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
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
