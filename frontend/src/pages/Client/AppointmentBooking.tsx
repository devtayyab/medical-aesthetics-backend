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
import LayeredBG from "@/assets/LayeredBg.svg";
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
import { FaChevronLeft, FaChevronRight, FaClock, FaCheckCircle } from "react-icons/fa";

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 1rem;
  position: relative;
  @media (min-width: 768px) {
    padding: 40px 2rem;
  }
`;

const calendarContainerStyle = css`
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  padding: 20px;
  border: 1px solid #f0f0f0;
  @media (min-width: 768px) {
    padding: 30px;
  }
`;

const timeSlotStyle = (isSelected: boolean, isAvailable: boolean) => css`
  padding: 12px;
  text-align: center;
  border-radius: 12px;
  cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
  border: 1px solid ${isSelected ? '#CBFF38' : '#f0f0f0'};
  background: ${isSelected ? '#CBFF38' : isAvailable ? 'white' : '#f9f9f9'};
  color: ${isAvailable ? '#333' : '#ccc'};
  transition: all 0.2s;
  font-weight: 500;
  &:hover {
    ${isAvailable && !isSelected && 'background: #f7faeb; border-color: #CBFF38;'}
  }
`;

const dayStyle = (isCurrentMonth: boolean, isSelected: boolean, isPast: boolean) => css`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${isPast ? 'not-allowed' : 'pointer'};
  border-radius: 50%;
  font-weight: ${isSelected ? '600' : '400'};
  background: ${isSelected ? '#CBFF38' : 'transparent'};
  color: ${isPast ? '#ccc' : isCurrentMonth ? '#333' : '#bbb'};
  transition: all 0.2s;
  &:hover {
    ${!isPast && !isSelected && 'background: #f0f0f0;'}
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
      console.log('🔍 Processing services:', { services, serviceIds, clinicId });
      const servicesToAdd = services.filter((s) => serviceIds.includes(s.id));
      servicesToAdd.forEach((service) => dispatch(addService(service)));

      // Auto fetch for today or selected date
      const fetchParams = {
        clinicId,
        serviceId: serviceIds[0],
        date: format(selectedDateState, "yyyy-MM-dd"),
      };
      console.log('📅 Fetching availability with params:', fetchParams);
      dispatch(fetchAvailability(fetchParams));
      hasProcessedServices.current = true;
    }
  }, [dispatch, services, serviceIds, clinicId, selectedDateState]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 Booking State Updated:', {
      availableSlots: availableSlots.length,
      selectedSlot,
      selectedServices: selectedServices.length,
      clinicId,
      serviceIds,
      userId: user?.id,
      isLoading: bookingLoading
    });
  }, [availableSlots, selectedSlot, selectedServices, clinicId, serviceIds, user, bookingLoading]);

  const handleDateClick = (day: Date) => {
    console.log('📅 Date clicked:', format(day, "yyyy-MM-dd"));
    if (isBefore(day, startOfToday())) {
      console.warn('⚠️ Past date selected, ignoring');
      return;
    }
    setSelectedDateState(day);
    setSelectedSlot(null);
    if (clinicId && serviceIds.length > 0) {
      const fetchParams = {
        clinicId,
        serviceId: serviceIds[0],
        date: format(day, "yyyy-MM-dd"),
      };
      console.log('📅 Fetching availability for new date:', fetchParams);
      dispatch(fetchAvailability(fetchParams));
    }
  };

  const handleSlotClick = async (slot: TimeSlot) => {
    console.log('🕐 Slot clicked:', slot);
    if (!slot.available) {
      console.warn('⚠️ Slot not available');
      return;
    }
    setSelectedSlot(slot);

    // Auto hold slot when selected
    if (clinicId && serviceIds.length > 0 && user?.id) {
      try {
        console.log('🔒 Holding slot:', {
          clinicId,
          serviceId: serviceIds[0],
          providerId: slot.providerId || clinicId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        await dispatch(holdTimeSlot({
          clinicId,
          serviceId: serviceIds[0],
          providerId: slot.providerId || clinicId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })).unwrap();
        console.log('✅ Slot held successfully');
      } catch (err) {
        console.error("❌ Failed to hold slot:", err);
      }
    } else {
      console.warn('⚠️ Missing required data for holding slot:', {
        clinicId,
        serviceIdsLength: serviceIds.length,
        userId: user?.id
      });
    }
  };

  const handleProceed = () => {
    console.log('🚀 Proceed to checkout clicked');
    console.log('📋 Current state:', { selectedSlot, clinic, selectedServices });

    if (!selectedSlot || !clinic) {
      console.error('❌ Cannot proceed - missing data:', {
        hasSelectedSlot: !!selectedSlot,
        hasClinic: !!clinic
      });
      return;
    }

    console.log('✅ Setting booking data and navigating to checkout');
    dispatch(setSelectedClinic(clinic));
    dispatch(setSelectedDate(format(selectedDateState, "yyyy-MM-dd")));
    dispatch(setSelectedTimeSlot(selectedSlot));

    console.log('🔄 Navigating to /checkout');
    navigate('/checkout');
  };

  // Calendar Helpers
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#33373F]">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FaChevronLeft className="text-gray-600" />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FaChevronRight className="text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const isPast = isBefore(cloneDay, startOfToday());

        days.push(
          <div
            key={day.toISOString()}
            className={dayStyle(isSameMonth(day, monthStart), isSameDay(day, selectedDateState), isPast)}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span>{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-2">{rows}</div>;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading booking system...</div>;
  }

  return (
    <div className={containerStyle}>
      <img src={LayeredBG} alt="" className="absolute top-0 left-0 w-full z-[-1] opacity-50" />

      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium transition-colors">
          <FaChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-[#CBFF38] font-bold">01</span> Date & Time
          <FaChevronRight size={10} />
          <span>02</span> Checkout
          <FaChevronRight size={10} />
          <span>03</span> Confirm
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Calendar & Slots */}
        <div className="lg:col-span-2 space-y-6">
          <div className={calendarContainerStyle}>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>

          <div className={calendarContainerStyle}>
            <div className="flex items-center gap-2 mb-6">
              <FaClock className="text-[#CBFF38]" />
              <h3 className="text-xl font-bold text-[#33373F]">Available Time Slots</h3>
            </div>

            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.startTime}
                    className={timeSlotStyle(selectedSlot?.startTime === slot.startTime, slot.available)}
                    onClick={() => handleSlotClick(slot)}
                  >
                    {format(new Date(slot.startTime), "HH:mm")}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                No availability found for this date. Please select another day.
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-1">
          <div className={`${calendarContainerStyle} sticky top-8`}>
            <h3 className="text-xl font-bold text-[#33373F] mb-6 border-b pb-4">Booking Summary</h3>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Clinic</p>
                <p className="font-semibold text-gray-800">{clinic?.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Services</p>
                <ul className="space-y-2">
                  {selectedServices.map(s => (
                    <li key={s.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{s.name}</span>
                      <span className="font-bold">${s.price}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedSlot && (
                <div className="bg-[#f7faeb] p-4 rounded-xl border border-[#CBFF38]">
                  <p className="text-xs text-[#5f8b00] uppercase font-bold mb-1">Selected Slot</p>
                  <p className="font-bold text-gray-800">
                    {format(selectedDateState, "EEEE, MMM d")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedSlot.startTime), "HH:mm")} - {format(new Date(selectedSlot.endTime), "HH:mm")}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mb-8">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>${selectedServices.reduce((acc, s) => acc + s.price, 0)}</span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={!selectedSlot || bookingLoading}
              onClick={handleProceed}
              className="bg-[#CBFF38] text-[#203400] hover:bg-[#A7E52F]"
            >
              {bookingLoading ? "Holding slot..." : "Continue to Checkout"}
            </Button>

            {!selectedSlot && (
              <p className="text-center text-xs text-gray-400 mt-4 italic">
                Please select a time slot to continue
              </p>
            )}

            {holdId && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-600 font-medium">
                <FaCheckCircle /> Slot held for 15 minutes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
