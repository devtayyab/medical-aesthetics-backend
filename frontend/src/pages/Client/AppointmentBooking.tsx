import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  fetchAvailability,
  holdTimeSlot,
  createAppointment,
  clearBooking,
  setSelectedClinic,
  addService,
  removeService,
} from "@/store/slices/bookingSlice";
import {
  fetchClinicServices,
  fetchClinicById,
} from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import type { Clinic, Service, TimeSlot } from "@/types";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import BotoxImg from "@/assets/Botox.jpg";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 2rem;
  position: relative;
`;

const layeredBGStyle = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100%;
  background-image: url(${LayeredBG});
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  z-index: -1;
`;

const headerStyle = css`
  display: flex;
  gap: 24px;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
`;

const titleStyle = css`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
`;

const sectionStyle = css`
  margin: 2rem 0;
  position: relative;
  z-index: 1;
`;

const calendarGridStyle = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 1rem;
`;

const dayHeaderStyle = css`
  text-align: center;
  font-weight: 600;
  color: #4a5568;
  padding: 8px 0;
  font-size: 0.875rem;
`;

const dayCellStyle = (
  isAvailable: boolean,
  isSelected: boolean,
  isCurrentMonth: boolean
) => css`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
  cursor: ${isAvailable ? "pointer" : "not-allowed"};
  background-color: ${isAvailable && isSelected
    ? "#CBFF38"
    : isAvailable
      ? "#D7DAE0"
      : "transparent"};
  color: ${isAvailable ? "#33373F" : "#a0aec0"};
  opacity: ${isCurrentMonth ? 1 : 0.4};
  pointer-events: ${isAvailable ? "auto" : "none"};
  transition: all 0.2s ease;
  &:hover {
    background-color: ${isAvailable ? "#CBFF38" : "transparent"};
  }
`;

const timeSlotsStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(4px);
`;

const timeSlotButtonStyle = (isSelected: boolean) => css`
  padding: 12px 16px;
  background: ${isSelected ? "#CBFF38" : "#fff"};
  color: ${isSelected ? "#33373F" : "#4a5568"};
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  &:hover {
    background: #cbff38;
    color: #33373f;
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
    error,
    selectedServices,
    selectedClinic,
  } = useSelector((state: RootState) => state.booking);

  const {
    services,
    clinics,
    isLoading: clientLoading,
  } = useSelector((state: RootState) => ({
    services: state.client.services,
    clinics: state.client.clinics,
    isLoading: state.client.isLoading,
  }));

  const clinicId = searchParams.get("clinicId");
  const serviceIds = searchParams.get("serviceIds")?.split(",") || [];

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const hasProcessedServices = useRef(false);
  const hasFetchedAvailability = useRef(false);

  const clinic = selectedClinic || clinics.find((c) => c.id === clinicId);

  console.log("selectedClinic", selectedClinic);
  const isLoading = bookingLoading || clientLoading || !clinicId;

  // === Calendar Logic ===
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fill leading empty cells
  const firstDayOfWeek = monthStart.getDay();
  const leadingEmptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // Get business hours for a given date
  const getDayBusinessHours = (date: Date) => {
    if (!clinic?.businessHours) return null;
    const dayName = format(
      date,
      "EEEE"
    ).toLowerCase() as keyof typeof clinic.businessHours;
    return clinic.businessHours[dayName];
  };

  // Generate time slots for a specific date
  const generateTimeSlotsForDate = (date: Date): TimeSlot[] => {
    const hours = getDayBusinessHours(date);
    if (!hours || !hours.isOpen) return [];

    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = hours.open.split(":").map(Number);
    const [closeHour, closeMinute] = hours.close.split(":").map(Number);

    const start = new Date(date);
    start.setHours(openHour, openMinute, 0, 0);

    const end = new Date(date);
    end.setHours(closeHour, closeMinute, 0, 0);

    const serviceDuration = selectedServices[0]?.durationMinutes || 30;

    let current = new Date(start);
    while (current < end) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      if (slotEnd <= end) {
        slots.push({
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true,
        });
      }
      current = slotEnd;
    }

    return slots;
  };

  // Available dates for current month
  const availableDates = useMemo(() => {
    return monthDays.filter((date) => {
      const hours = getDayBusinessHours(date);
      return hours?.isOpen === true;
    });
  }, [monthDays, clinic?.businessHours]);

  // Time slots for selected date
  const timeSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlotsForDate(selectedDate);
  }, [selectedDate, clinic?.businessHours, selectedServices]);

  // === Effects ===
  useEffect(() => {
    if (clinicId) {
      dispatch(fetchClinicById(clinicId));
      dispatch(fetchClinicServices(clinicId));
      hasProcessedServices.current = false;
      hasFetchedAvailability.current = false;
    }
  }, [dispatch, clinicId]);

  useEffect(() => {
    if (clinicId && clinics.length > 0 && !selectedClinic) {
      const clinicData = clinics.find((c) => c.id === clinicId);
      if (clinicData) {
        dispatch(setSelectedClinic(clinicData));
      }
    }
  }, [dispatch, clinicId, clinics, selectedClinic]);

  useEffect(() => {
    if (
      services.length > 0 &&
      serviceIds.length > 0 &&
      clinicId &&
      !hasProcessedServices.current
    ) {
      const servicesToAdd = services.filter((s) => serviceIds.includes(s.id));
      if (servicesToAdd.length > 0) {
        servicesToAdd.forEach((service) => dispatch(addService(service)));
      }

      if (!hasFetchedAvailability.current) {
        dispatch(
          fetchAvailability({
            clinicId,
            serviceId: serviceIds[0],
            date: format(new Date(), "yyyy-MM-dd"),
          })
        );
        hasFetchedAvailability.current = true;
      }

      hasProcessedServices.current = true;
    }
  }, [dispatch, services, serviceIds, clinicId]);

  useEffect(() => {
    return () => {
      hasProcessedServices.current = false;
      hasFetchedAvailability.current = false;
    };
  }, []);

  // === Handlers ===
  const handleHoldSlot = async () => {
    if (clinicId && serviceIds.length > 0 && selectedSlot && user?.id) {
      const [startTime, endTime] = selectedSlot.split(" - ");
      await dispatch(
        holdTimeSlot({
          clinicId,
          serviceId: serviceIds[0],
          providerId: clinic.ownerId,
          startTime,
          endTime,
        })
      ).unwrap();
    }
  };

  const handleBookAppointment = async () => {
    if (clinicId && serviceIds.length > 0 && selectedSlot && user?.id) {
      const [startTime, endTime] = selectedSlot.split(" - ");
      for (const serviceId of serviceIds) {
        await dispatch(
          createAppointment({
            clinicId,
            serviceId,
            providerId: clinic.ownerId,
            clientId: user.id,
            startTime,
            endTime,
            notes,
            holdId,
          })
        ).unwrap();
      }
      dispatch(clearBooking());
      navigate("/appointments");
    }
  };

  if (isLoading) {
    return (
      <div className={containerStyle}>
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerStyle}>
      <div className={layeredBGStyle} />
      <div className={headerStyle}>
        <img
          className="max-w-[380px] rounded-[16px]"
          src={BotoxImg}
          alt="Treatment"
        />
        <div>
          <h2 className={titleStyle}>Laser Hair Removal – Alexandrite</h2>
          <p className="bg-[#EDEEF1] p-3 text-[14px] text-[#33373F]">
            <strong>Important Medical Note:</strong> For optimal and lasting
            results, a course of 6-8 sessions is typically recommended, spaced
            4-6 weeks apart.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Services Card */}
      <div className="flex justify-between my-10">
        <div className="w-2/3 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold text-gray-800">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>

            <div className={calendarGridStyle}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className={dayHeaderStyle}>
                  {day}
                </div>
              ))}

              {leadingEmptyDays.map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {monthDays.map((date) => {
                const isAvailable = availableDates.some((d) =>
                  isSameDay(d, date)
                );
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, currentMonth);

                return (
                  <div
                    key={date.toISOString()}
                    className={dayCellStyle(
                      isAvailable,
                      isSelected,
                      isCurrentMonth
                    )}
                    onClick={() => isAvailable && setSelectedDate(date)}
                  >
                    {format(date, "d")}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-transparent">
            {selectedDate ? (
              <div className={timeSlotsStyle}>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">
                  {format(selectedDate, "EEEE, MMMM d")}
                </h4>
                {timeSlotsForSelectedDate.length > 0 ? (
                  timeSlotsForSelectedDate.map((slot) => {
                    const timeStr = `${format(new Date(slot.startTime), "h:mm a")} - ${format(
                      new Date(slot.endTime),
                      "h:mm a"
                    )}`;
                    const isSelected = selectedSlot === timeStr;

                    return (
                      <button
                        key={slot.startTime}
                        className={timeSlotButtonStyle(isSelected)}
                        onClick={() => setSelectedSlot(timeStr)}
                      >
                        {timeStr}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No slots available
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-baseline justify-center h-full text-gray-500">
                <p>Select a date to view available times</p>
              </div>
            )}
          </div>
        </div>
        <div className="w-[270px]">
          <div className="p-5 bg-white rounded-[12px] border border-[#3C3C3C4D]">
            <h3 className="text-center text-[18px] text-[#33373F] font-semibold mb-3">
              Treatments
            </h3>
            {selectedServices.length > 0 ? (
              <ul className="">
                {selectedServices.map((service) => (
                  <li key={service.id} className="text-gray-700 space-y-2">
                    <span className="block text-[#33373F] font-semibold">
                      {service.name}
                    </span>
                    <span className="block text-[#586271]">
                      Duration: {service.durationMinutes} min
                    </span>
                    <span className="block text-[#586271]">
                      Price: €{service.price}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No services selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Calendar + Time Slots */}
      <div className={sectionStyle}>
        {/* Notes & Actions */}
        <div className="mt-8 space-y-4">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleHoldSlot}
              disabled={!selectedSlot || bookingLoading}
              className="flex-1"
            >
              Hold Slot
            </Button>
            <Button
              onClick={handleBookAppointment}
              disabled={!holdId || bookingLoading}
              className="flex-1"
            >
              Confirm Booking
            </Button>
            <Button onClick={() => navigate(-1)} variant="secondary">
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
