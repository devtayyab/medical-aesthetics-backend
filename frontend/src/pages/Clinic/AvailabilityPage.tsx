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
import { crmAPI } from "../../services/api";
import { BusinessHours, BlockedSlot } from "../../types/clinic.types";
import { Clock, Save, Calendar, Plus, Trash2 } from "lucide-react";

const AvailabilityPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { availability, isLoading } = useSelector(
    (state: RootState) => state.clinic
  );
  const user = useSelector((state: RootState) => state.auth.user);

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: "09:00", close: "17:00", isOpen: true },
    tuesday: { open: "09:00", close: "17:00", isOpen: true },
    wednesday: { open: "09:00", close: "17:00", isOpen: true },
    thursday: { open: "09:00", close: "17:00", isOpen: true },
    friday: { open: "09:00", close: "17:00", isOpen: true },
    saturday: { open: "10:00", close: "15:00", isOpen: true },
    sunday: { open: "10:00", close: "15:00", isOpen: false },
  });

  const [blockedDates, setBlockedDates] = useState<{ id: string; date: string }[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<{ id: string; result: BlockedSlot }[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newSlot, setNewSlot] = useState({ date: "", startTime: "09:00", endTime: "10:00" });
  const [timezone, setTimezone] = useState("Europe/Athens");
  const [isSaving, setIsSaving] = useState(false);
  const [availableClinics, setAvailableClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");

  useEffect(() => {
    const loadClinics = async () => {
      try {
        const res = await crmAPI.getAccessibleClinics();
        setAvailableClinics(res.data || []);
        if (res.data?.length > 0) {
          setSelectedClinicId(res.data[0].id);
        }
      } catch (err) {
        console.error("Failed to load clinics", err);
      }
    };
    loadClinics();
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      dispatch(fetchAvailability(selectedClinicId));
      loadBlockedSlots(selectedClinicId);
    }
  }, [selectedClinicId, user?.id, dispatch]);

  const loadBlockedSlots = async (clinicId?: string) => {
    try {
      const providerId = user?.role === 'doctor' ? user.id : undefined;
      const result = await dispatch(fetchBlockedSlots({ providerId, clinicId }) as any).unwrap();
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
    if (!selectedClinicId) {
      alert("Please select a clinic first.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        businessHours,
        timezone,
        clinicId: selectedClinicId,
      };

      await dispatch(updateAvailability(payload)).unwrap();
      alert("Availability settings saved successfully!");
    } catch (error: any) {
      console.error("Failed to save availability:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDayHours = (day: string, field: "open" | "close" | "isOpen", value: any) => {
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
      const start = new Date(newBlockedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(newBlockedDate);
      end.setHours(23, 59, 59, 999);

      try {
        await dispatch(blockTimeSlot({
          clinicId: selectedClinicId,
          providerId: user?.role === 'doctor' ? user.id : undefined,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: 'Full Day Block'
        } as any)).unwrap();
        setNewBlockedDate("");
        loadBlockedSlots(selectedClinicId);
      } catch (err) {
        alert("Failed to block date");
      }
    }
  };

  const removeBlockedDate = async (id: string) => {
    try {
      await dispatch(unblockTimeSlot(id)).unwrap();
      loadBlockedSlots(selectedClinicId);
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
          clinicId: selectedClinicId,
          providerId: user?.role === 'doctor' ? user.id : undefined,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          reason: 'Partial Block'
        } as any)).unwrap();
        setNewSlot({ ...newSlot, date: "" });
        loadBlockedSlots(selectedClinicId);
      } catch (err) {
        alert("Failed to block slot");
      }
    }
  };

  const removeBlockedSlot = async (id: string) => {
    try {
      await dispatch(unblockTimeSlot(id)).unwrap();
      loadBlockedSlots(selectedClinicId);
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

  if (isLoading && !availability) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Syncing clinical configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Operational Status: Online</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Availability</h1>
              <p className="text-gray-400 font-medium max-w-md">Manage your clinic's working hours and blocked dates for seamless scheduling.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {availableClinics.length > 1 && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-3">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Select Clinic</span>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="bg-transparent border-none text-white font-black uppercase text-[10px] tracking-widest outline-none cursor-pointer"
                >
                  {availableClinics.map(c => (
                    <option key={c.id} value={c.id} className="bg-black">{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group h-14 px-8 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-xl shadow-lime-500/10 flex items-center gap-3"
            >
              <Save className="group-hover:scale-110 transition-transform" size={18} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Hours Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38]">
                    <Clock size={22} />
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Working Hours</h2>
                </div>
              </div>

              <div className="space-y-6">
                {days.map((day) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-50 hover:border-black transition-all group">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={businessHours[day]?.isOpen || false}
                          onChange={(e) => updateDayHours(day, "isOpen", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CBFF38]" />
                      </label>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-900 group-hover:italic transition-all capitalize">{day}</span>
                    </div>

                    {businessHours[day]?.isOpen ? (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          <input
                            type="time"
                            value={businessHours[day]?.open || "09:00"}
                            onChange={(e) => updateDayHours(day, "open", e.target.value)}
                            className="h-10 pl-10 pr-4 bg-white border border-gray-100 rounded-xl font-black text-xs text-gray-900 focus:ring-2 focus:ring-black outline-none white-indicator"
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase italic">To</span>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          <input
                            type="time"
                            value={businessHours[day]?.close || "17:00"}
                            onChange={(e) => updateDayHours(day, "close", e.target.value)}
                            className="h-10 pl-10 pr-4 bg-white border border-gray-100 rounded-xl font-black text-xs text-gray-900 focus:ring-2 focus:ring-black outline-none white-indicator"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">Clinic Closed</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-1 italic">Timeline Configuration</p>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-14 pl-6 pr-10 bg-gray-50 border-none rounded-2xl font-black uppercase text-[10px] tracking-widest appearance-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Clock size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Blocked Dates */}
            <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="size-10 bg-black rounded-xl flex items-center justify-center text-[#CBFF38]">
                  <Calendar size={18} />
                </div>
                <h2 className="text-[15px] font-black uppercase italic tracking-tighter text-gray-900">Blackout Dates</h2>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-2 italic">Add New Block</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={newBlockedDate}
                        onChange={(e) => setNewBlockedDate(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border-none rounded-2xl font-black uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-black outline-none white-indicator"
                      />
                    </div>
                    <button
                      onClick={addBlockedDate}
                      className="size-12 bg-black text-[#CBFF38] rounded-2xl flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all shadow-lg"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {blockedDates.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-gray-50 rounded-3xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">No Blocks</p>
                    </div>
                  ) : (
                    blockedDates.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-black transition-all">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-[10px] shadow-sm italic">
                            {new Date(item.date).getDate()}
                          </div>
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-900 group-hover:text-white">
                              {new Date(item.date).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBlockedDate(item.id)}
                          className="size-8 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Temporary Blocks */}
            <section className="bg-[#0D0D0D] rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-10 bg-[#CBFF38] rounded-xl flex items-center justify-center text-white">
                    <Clock size={18} />
                  </div>
                  <h2 className="text-[15px] font-black uppercase italic tracking-tighter text-white">Temporary Blocks</h2>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 ml-2 italic">Date</p>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                      <input
                        type="date"
                        value={newSlot.date}
                        onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                        className="w-full h-12 pl-10 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] tracking-widest focus:ring-2 focus:ring-[#CBFF38] outline-none white-indicator appearance-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 ml-2 italic">Entry</p>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                        <input
                          type="time"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                          className="w-full h-12 pl-10 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] tracking-widest focus:ring-2 focus:ring-[#CBFF38] outline-none white-indicator appearance-none"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 ml-2 italic">Exit</p>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                        <input
                          type="time"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                          className="w-full h-12 pl-10 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] tracking-widest focus:ring-2 focus:ring-[#CBFF38] outline-none white-indicator appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={addBlockedSlot}
                    className="w-full h-12 bg-white text-black hover:bg-[#CBFF38] rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest italic"
                  >
                    <Plus size={14} /> Add Block
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                  {blockedSlots.length === 0 ? (
                    <div className="py-8 text-center border border-white/10 rounded-3xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">No Active Blocks</p>
                    </div>
                  ) : (
                    blockedSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-[#CBFF38] transition-all">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-[10px] font-black text-white italic">
                              {new Date(slot.result.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-[10px] font-black text-[#CBFF38] italic">
                              {slot.result.startTime} - {slot.result.endTime}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBlockedSlot(slot.id)}
                          className="size-8 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;
