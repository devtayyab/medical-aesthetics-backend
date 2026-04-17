import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import {
  fetchAvailability,
  holdTimeSlot,
  setSelectedClinic,
  addService,
  setSelectedDate,
  setSelectedTimeSlot,
} from "@/store/slices/bookingSlice";
import {
  fetchClinicServices,
  fetchClinicById,
} from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import type { TimeSlot } from "@/types";
import { css } from "@emotion/css";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  startOfToday
} from "date-fns";
import { FaChevronLeft, FaChevronRight, FaClock, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";

const containerStyle = css`
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 1rem;
`;

const cardStyle = css`
  background: white;
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.02);
`;

const sidebarCardStyle = css`
  background: #121212;
  border-radius: 32px;
  padding: 32px;
  color: white;
  box-shadow: 0 40px 80px rgba(0,0,0,0.15);
  position: relative;
  overflow: hidden;
`;

const dayStyle = (isCurrentMonth: boolean, isSelected: boolean, isPast: boolean) => css`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${isPast ? 'not-allowed' : 'pointer'};
  border-radius: 16px;
  font-weight: ${isSelected ? '900' : '700'};
  font-size: 14px;
  background: ${isSelected ? '#121212' : 'transparent'};
  color: ${isPast ? '#e2e8f0' : isSelected ? '#CBFF38' : isCurrentMonth ? '#1a202c' : '#cbd5e0'};
  transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  ${isSelected && 'box-shadow: 0 10px 20px rgba(0,0,0,0.1);'}
  &:hover {
    ${!isPast && !isSelected && 'background: #f1f5f9; color: #000; transform: scale(1.05);'}
  }
`;

const slotButton = (isSelected: boolean, isAvailable: boolean) => css`
  padding: 16px 10px;
  text-align: center;
  border-radius: 16px;
  font-weight: 900;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
  border: 2px solid ${isSelected ? '#000' : '#f1f5f9'};
  background: ${isSelected ? '#000' : isAvailable ? 'white' : '#f8fafc'};
  color: ${isSelected ? '#CBFF38' : isAvailable ? '#000' : '#cbd5e0'};
  &:hover {
    ${isAvailable && !isSelected && 'border-color: #000; color: #000; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05);'}
  }
`;

export const AppointmentBooking: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    availableSlots,
    holdId,
    isLoading: bookingLoading,
    selectedServices,
    selectedClinic,
    availabilityReason,
  } = useSelector((state: RootState) => state.booking);

  const services = useSelector((state: RootState) => state.client.services);
  const clinics = useSelector((state: RootState) => state.client.clinics);
  const selectedClinicFromClient = useSelector((state: RootState) => state.client.selectedClinic);
  const clientLoading = useSelector((state: RootState) => state.client.isLoading);

  const clinicId = searchParams.get("clinicId");
  const serviceIds = searchParams.get("serviceIds")?.split(",") || [];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateState, setSelectedDateState] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showMobileTimes, setShowMobileTimes] = useState(false);

  const hasProcessedServices = useRef(false);

  const clinic = selectedClinic || selectedClinicFromClient || clinics.find((c) => c.id === clinicId);
  const isLoading = bookingLoading || clientLoading || !clinicId;

  useEffect(() => {
    if (clinicId) {
      dispatch(fetchClinicById(clinicId));
      dispatch(fetchClinicServices(clinicId));
      hasProcessedServices.current = false;
    }
  }, [dispatch, clinicId]);

  useEffect(() => {
    if (services.length > 0 && serviceIds.length > 0 && clinicId && !hasProcessedServices.current) {
      const servicesToAdd = services.filter((s) => serviceIds.includes(s.id));
      servicesToAdd.forEach((service) => dispatch(addService(service)));

      dispatch(fetchAvailability({
        clinicId,
        serviceId: serviceIds,
        date: format(selectedDateState, "yyyy-MM-dd"),
      }));
      hasProcessedServices.current = true;
    }
  }, [dispatch, services, serviceIds, clinicId, selectedDateState]);

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const handleDateClick = (day: Date) => {
    if (isBefore(day, startOfToday())) return;
    setSelectedDateState(day);
    setSelectedSlot(null);
    setShowMobileTimes(true);
    if (clinicId && serviceIds.length > 0) {
      dispatch(fetchAvailability({
        clinicId,
        serviceId: serviceIds,
        date: format(day, "yyyy-MM-dd"),
        providerId: selectedProviderId || undefined,
      }));
    }
  };

  const handleProviderSelect = (providerId: string | null) => {
    setSelectedProviderId(providerId);
    setSelectedSlot(null);
    if (clinicId && serviceIds.length > 0) {
      dispatch(fetchAvailability({
        clinicId,
        serviceId: serviceIds,
        date: format(selectedDateState, "yyyy-MM-dd"),
        providerId: providerId || undefined,
      }));
    }
  };

  const handleSlotClick = async (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    if (clinicId && serviceIds.length > 0) {
      try {
        await dispatch(holdTimeSlot({
          clinicId,
          serviceId: serviceIds[0],
          additionalServiceIds: serviceIds.slice(1),
          providerId: slot.providerId || undefined,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })).unwrap();
      } catch (err) {
        console.error('Failed to hold slot:', err);
      }
    }
  };

  const handleProceed = () => {
    if (!selectedSlot || !clinic) return;
    dispatch(setSelectedClinic(clinic));
    dispatch(setSelectedDate(format(selectedDateState, "yyyy-MM-dd")));
    dispatch(setSelectedTimeSlot(selectedSlot));
    navigate('/checkout');
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isPast = isBefore(cloneDay, startOfToday());
        days.push(
          <div
            key={day.toISOString()}
            className={dayStyle(isSameMonth(day, monthStart), isSameDay(day, selectedDateState), isPast)}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span>{format(day, "d")}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-1" key={day.toISOString()}>{days}</div>);
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-black uppercase tracking-tighter animate-pulse">Establishing Connection...</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className={containerStyle}>
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
            <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#CBFF38] group-hover:text-black transition-all shadow-sm">
              <FaChevronLeft size={10} />
            </div>
            Back to Search
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-xl bg-[#121212] text-[#CBFF38] flex items-center justify-center font-black text-xs shadow-xl shadow-black/10">1</div>
              <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Time</span>
            </div>
            <div className="w-12 h-[2px] bg-gray-100 -mt-4" />
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center font-black text-xs shadow-sm">2</div>
              <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Details</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Section */}
          <div className="lg:col-span-8 space-y-8">
            <div className={cardStyle}>
              <div className="flex items-center justify-between mb-6">
                <div>
                   <h4 className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-400 mb-1 italic">Select the Exact Time</h4>
                   <h2 className="text-xl font-black uppercase italic text-gray-900">{format(currentMonth, "MMMM yyyy")}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="size-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-[#121212] hover:text-[#CBFF38] hover:border-[#121212] transition-colors"><FaChevronLeft size={12} /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="size-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-[#121212] hover:text-[#CBFF38] hover:border-[#121212] transition-colors"><FaChevronRight size={12} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest py-1 italic">{d}</div>
                ))}
              </div>
              {renderCells()}
            </div>

            <div className={`${cardStyle} hidden lg:block`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-8 rounded-lg bg-lime-50 flex items-center justify-center">
                   <FaClock className="text-lime-500" size={14} />
                </div>
                <h3 className="text-xl font-black uppercase italic text-gray-900">Available Times</h3>
              </div>

              {/* Provider Selection (Step B2) */}
              {clinic?.providers && clinic.providers.length > 0 && (
                <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Choose Professional (Optional)</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${!selectedProviderId ? 'border-lime-500 bg-white shadow-sm' : 'border-transparent'}`}
                      onClick={() => handleProviderSelect(null)}
                    >
                      <div className="size-12 rounded-full bg-gray-200 flex items-center justify-center font-black text-xs text-gray-500 italic">Any</div>
                      <span className="text-[10px] font-black uppercase tracking-tight">Any Professional</span>
                    </button>
                    {clinic.providers.map((p: any) => (
                      <button
                        key={p.id}
                        className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedProviderId === p.id ? 'border-lime-500 bg-white shadow-sm' : 'border-transparent'}`}
                        onClick={() => handleProviderSelect(p.id)}
                      >
                        <img src={p.photoUrl || `https://ui-avatars.com/api/?name=${p.firstName}+${p.lastName}&background=random`} className="size-12 rounded-full object-cover" alt={p.firstName} />
                        <span className="text-[10px] font-black uppercase tracking-tight">{p.firstName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      className={slotButton(selectedSlot?.startTime === slot.startTime, slot.available)}
                      onClick={() => handleSlotClick(slot)}
                    >
                      {format(new Date(slot.startTime), "HH:mm")}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm font-black uppercase text-gray-400">No availability for this date</p>
                  {availabilityReason && (
                    <p className="text-[10px] font-black uppercase text-red-500 mt-2 italic">{availabilityReason}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* High Contrast Sidebar Summary */}
          <div className="lg:col-span-4 sticky top-8">
            <div className={sidebarCardStyle}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#CBFF38]/5 rounded-full blur-2xl" />
              
              <h3 className="text-xl font-black uppercase italic text-white mb-6 pb-4 border-b border-white/10 relative z-10">Booking Details</h3>

              <div className="space-y-6 mb-8 relative z-10">
                <div>
                  <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2 italic">Clinic Selected</h4>
                  <p className="text-base font-black text-white uppercase italic">{clinic?.name}</p>
                </div>

                <div>
                  <h4 className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2 italic">Requested Treatments</h4>
                  <div className="space-y-2">
                    {selectedServices.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl">
                        <span className="text-[10px] font-black uppercase italic text-white tracking-widest">{s.treatment?.name || s.name || 'Treatment'}</span>
                        <span className="text-[12px] font-black text-[#CBFF38]"><span className="font-sans font-medium">€</span>{Number(s.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSlot && (
                  <div className="p-4 rounded-2xl bg-[#CBFF38] text-black shadow-xl shadow-[#CBFF38]/10 animate-in zoom-in-95 duration-300 mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCalendarAlt className="text-black/60" size={10} />
                      <span className="text-[9px] font-black uppercase text-black/60 tracking-[0.2em] italic">Scheduled For</span>
                    </div>
                    <p className="text-base font-black uppercase italic">{format(selectedDateState, "EEEE, MMMM d")}</p>
                    <p className="text-2xl font-black leading-none">{format(new Date(selectedSlot.startTime), "HH:mm")}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-6 mb-8 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] italic">Total</span>
                  <span className="text-2xl font-black text-white"><span className="font-sans mr-1">€</span>{selectedServices.reduce((acc, s) => acc + Number(s.price), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button
                fullWidth
                disabled={!selectedSlot || !clinic || bookingLoading}
                onClick={handleProceed}
                className="bg-[#CBFF38] text-black hover:bg-lime-400 hover:text-black h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:scale-105 transition-all relative z-10"
              >
                {bookingLoading ? "Waiting..." : "Checkout"}
              </Button>

              {holdId && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-[#CBFF38] font-black uppercase tracking-widest relative z-10 bg-[#CBFF38]/10 py-1.5 rounded-md">
                  <FaCheckCircle size={10}/> Slot Locked For 15m
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Time Slots */}
      {showMobileTimes && (
        <div className="fixed inset-0 z-[100] bg-black/40 lg:hidden flex flex-col justify-end transition-opacity">
          <div className="bg-white rounded-t-3xl p-6 w-full max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black uppercase italic text-gray-900">Select Time</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">{format(selectedDateState, "EEEE, MMMM d")}</p>
              </div>
              <button onClick={() => setShowMobileTimes(false)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 space-y-4">
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      className={slotButton(selectedSlot?.startTime === slot.startTime, slot.available)}
                      onClick={() => {
                        handleSlotClick(slot);
                        if (slot.available) {
                          setTimeout(() => setShowMobileTimes(false), 300);
                        }
                      }}
                    >
                      {format(new Date(slot.startTime), "HH:mm")}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm font-black uppercase text-gray-400">No availability for this date. Try another day.</p>
                </div>
              )}
            </div>

            {selectedSlot && (
              <div className="shrink-0 pt-4 border-t border-gray-100">
                <Button
                  fullWidth
                  disabled={bookingLoading}
                  onClick={() => { setShowMobileTimes(false); handleProceed(); }}
                  className="bg-[#CBFF38] text-black hover:bg-lime-400 h-16 rounded-2xl font-black uppercase tracking-widest text-base shadow-lg shadow-lime-200"
                >
                  {bookingLoading ? "Establishing..." : "Continue"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentBooking;
