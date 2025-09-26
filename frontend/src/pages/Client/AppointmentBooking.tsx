import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  fetchAvailability,
  holdTimeSlot,
  createAppointment,
  clearBooking,
} from "@/store/slices/bookingSlice";
import { fetchClinicServices } from "@/store/slices/clinicsSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import { Clinic } from "@/types"; // Import Clinic type

export const AppointmentBooking: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { availableSlots, selectedClinic, holdId, isLoading, error } =
    useSelector((state: RootState) => state.booking);
  const { services } = useSelector((state: RootState) => state.clinics); // Use clinics slice for services
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedClinic?.id) {
      dispatch(fetchClinicServices(selectedClinic.id));
    }
  }, [dispatch, selectedClinic]);

  const handleFetchAvailability = async () => {
    if (selectedClinic?.id && selectedServiceId) {
      dispatch(
        fetchAvailability({
          clinicId: selectedClinic.id,
          serviceId: selectedServiceId,
          providerId: "provider1", // Replace with dynamic provider selection if needed
          date: new Date().toISOString().split("T")[0],
        })
      );
    }
  };

  const handleHoldSlot = async () => {
    if (selectedClinic?.id && selectedServiceId && selectedSlot) {
      const [startTime, endTime] = selectedSlot.split(" - ");
      const response = await dispatch(
        holdTimeSlot({
          clinicId: selectedClinic.id,
          serviceId: selectedServiceId,
          providerId: "provider1",
          startTime,
          endTime,
        })
      ).unwrap();
      console.log("Slot held:", response);
    }
  };

  const handleBookAppointment = async () => {
    if (selectedClinic?.id && selectedServiceId && selectedSlot && user?.id) {
      const [startTime, endTime] = selectedSlot.split(" - ");
      await dispatch(
        createAppointment({
          clinicId: selectedClinic.id,
          serviceId: selectedServiceId,
          providerId: "provider1",
          clientId: user.id,
          startTime,
          endTime,
          notes,
          holdId,
        })
      ).unwrap();
      dispatch(clearBooking());
      navigate("/appointments");
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label
          htmlFor="clinic-select"
          className="block text-sm font-medium text-gray-700"
        >
          Select Clinic
        </label>
        <select
          id="clinic-select"
          value={selectedClinic?.id || ""}
          onChange={(e) => {
            const clinic = {
              id: e.target.value,
              name: e.target.options[e.target.selectedIndex].text,
            } as Clinic;
            dispatch({ type: "booking/setSelectedClinic", payload: clinic });
          }}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select Clinic
          </option>
          <option value="1">Aesthetic Clinic A</option>
          <option value="2">Featured Clinic B</option>
        </select>
      </div>
      <div className="mb-4">
        <label
          htmlFor="service-select"
          className="block text-sm font-medium text-gray-700"
        >
          Select Service
        </label>
        <select
          id="service-select"
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select Service
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{`${s.name} - $${s.price}`}</option>
          ))}
        </select>
      </div>
      <Button
        onClick={handleFetchAvailability}
        disabled={!selectedServiceId || isLoading}
      >
        Check Availability
      </Button>
      {availableSlots.length > 0 && (
        <div className="mt-4">
          <div className="mb-4">
            <label
              htmlFor="slot-select"
              className="block text-sm font-medium text-gray-700"
            >
              Select Time Slot
            </label>
            <select
              id="slot-select"
              value={selectedSlot || ""}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Time Slot
              </option>
              {availableSlots.map((s) => (
                <option
                  key={s.startTime}
                  value={`${s.startTime} - ${s.endTime}`}
                >
                  {`${new Date(s.startTime).toLocaleTimeString()} - ${new Date(s.endTime).toLocaleTimeString()}`}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleHoldSlot}
            disabled={!selectedSlot || isLoading}
          >
            Hold Slot
          </Button>
        </div>
      )}
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="mt-4"
      />
      <Button
        onClick={handleBookAppointment}
        disabled={!holdId || isLoading}
        className="mt-4"
      >
        Confirm Booking
      </Button>
    </div>
  );
};
