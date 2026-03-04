import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 1rem;
`;

const cardStyle = css`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
`;

const dayStyle = (isCurrentMonth: boolean, isSelected: boolean, isPast: boolean) => css`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${isPast ? 'not-allowed' : 'pointer'};
  border-radius: 12px;
  font-weight: ${isSelected ? '900' : '600'};
  font-size: 14px;
  background: ${isSelected ? '#CBFF38' : 'transparent'};
  color: ${isPast ? '#e2e8f0' : isCurrentMonth ? '#1a202c' : '#cbd5e0'};
  transition: all 0.2s;
  &:hover {
    ${!isPast && !isSelected && 'background: #f7fafc; color: #CBFF38;'}
  }
`;

const slotButton = (isSelected: boolean, isAvailable: boolean) => css`
  padding: 14px;
  text-align: center;
  border-radius: 12px;
  font-weight: 800;
  font-size: 13px;
  transition: all 0.2s;
  cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
  border: 2px solid ${isSelected ? '#CBFF38' : '#f7fafc'};
  background: ${isSelected ? '#CBFF38' : isAvailable ? 'white' : '#f7fafc'};
  color: ${isSelected ? '#000' : isAvailable ? '#4a5568' : '#cbd5e0'};
  &:hover {
    ${isAvailable && !isSelected && 'border-color: #CBFF38; color: #000;'}
  }
`;

export const AppointmentBooking: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    availableSlots,
    holdId,
    isLoading: bookingLoading,
    selectedServices,
    selectedClinic,
  } = useSelector((state: RootState) => state.booking);

  const services = useSelector((state: RootState) => state.client.services);
  const clinics = useSelector((state: RootState) => state.client.clinics);
  const clientLoading = useSelector((state: RootState) => state.client.isLoading);

  const clinicId = searchParams.get("clinicId");
  const serviceIds = searchParams.get("serviceIds")?.split(",") || [];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateState, setSelectedDateState] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showMobileTimes, setShowMobileTimes] = useState(false);

  const hasProcessedServices = useRef(false);

  const clinic = selectedClinic || clinics.find((c) => c.id === clinicId);
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
        serviceId: serviceIds[0],
        date: format(selectedDateState, "yyyy-MM-dd"),
      }));
      hasProcessedServices.current = true;
    }
  }, [dispatch, services, serviceIds, clinicId, selectedDateState]);

  const handleDateClick = (day: Date) => {
    if (isBefore(day, startOfToday())) return;
    setSelectedDateState(day);
    setSelectedSlot(null);
    setShowMobileTimes(true);
    if (clinicId && serviceIds.length > 0) {
      dispatch(fetchAvailability({
        clinicId,
        serviceId: serviceIds[0],
        date: format(day, "yyyy-MM-dd"),
      }));
    }
  };

  const handleSlotClick = async (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    if (clinicId && serviceIds.length > 0 && user?.id) {
      dispatch(holdTimeSlot({
        clinicId,
        serviceId: serviceIds[0],
        providerId: slot.providerId || undefined,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));
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
    <div className="min-h-screen bg-[#F7FAFC]">
      <div className={containerStyle}>
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
            <div className="size-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-all">
              <FaChevronLeft size={10} />
            </div>
            Back to Clinic
          </button>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-[#CBFF38] text-black flex items-center justify-center font-black text-xs">1</div>
              <span className="text-[10px] font-black uppercase mt-1">Time</span>
            </div>
            <div className="w-12 h-px bg-gray-200 -mt-4" />
            <div className="flex flex-col items-center">
              <div className="size-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-black text-xs">2</div>
              <span className="text-[10px] font-black uppercase mt-1">Details</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Calendar Section */}
          <div className="lg:col-span-8 space-y-8">
            <div className={cardStyle}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase italic text-gray-900">{format(currentMonth, "MMMM yyyy")}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="size-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all"><FaChevronLeft size={12} /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="size-10 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all"><FaChevronRight size={12} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest py-2">{d}</div>
                ))}
              </div>
              {renderCells()}
            </div>

            <div className={`${cardStyle} hidden lg:block`}>
              <div className="flex items-center gap-3 mb-8">
                <FaClock className="text-lime-500" />
                <h3 className="text-xl font-black uppercase italic text-gray-900">Available Times</h3>
              </div>
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
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-8">
            <div className={cardStyle}>
              <h3 className="text-xl font-black uppercase italic text-gray-900 mb-8 pb-4 border-b border-gray-100">Your Booking</h3>

              <div className="space-y-6 mb-12">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Clinic</h4>
                  <p className="text-base font-black text-gray-900 uppercase italic">{clinic?.name}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Treatments</h4>
                  <div className="space-y-3">
                    {selectedServices.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                        <span className="text-xs font-black uppercase italic">{s.treatment?.name || s.name || 'Treatment'}</span>
                        <span className="text-sm font-black text-gray-900">£{Number(s.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSlot && (
                  <div className="p-4 rounded-2xl bg-lime-50 border-2 border-[#CBFF38] animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCalendarAlt className="text-lime-600" size={12} />
                      <span className="text-[10px] font-black uppercase text-lime-600 tracking-widest">Scheduled For</span>
                    </div>
                    <p className="text-sm font-black text-gray-900 uppercase italic">{format(selectedDateState, "EEEE, MMMM d")}</p>
                    <p className="text-xl font-black text-gray-900 mt-1">{format(new Date(selectedSlot.startTime), "HH:mm")}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-gray-400">Total Price</span>
                  <span className="text-3xl font-black text-gray-900">£{selectedServices.reduce((acc, s) => acc + Number(s.price), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button
                fullWidth
                disabled={!selectedSlot || bookingLoading}
                onClick={handleProceed}
                className="bg-[#CBFF38] text-black hover:bg-lime-400 h-16 rounded-2xl font-black uppercase tracking-widest text-base shadow-lg shadow-lime-200"
              >
                {bookingLoading ? "Establishing..." : "Continue to Checkout"}
              </Button>

              {holdId && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-green-600 font-black uppercase tracking-widest">
                  <FaCheckCircle /> Slot reserved for 15m
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
                ✕
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
