import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { PaymentForm } from "@/components/molecules/PaymentForm";
import {
  fetchAvailability,
  holdSlot,
  createAppointment,
} from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import type { TimeSlot } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const AppointmentBooking: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { availableSlots, isLoading, error, holdId } = useSelector(
    (state: RootState) => state.client
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const params = new URLSearchParams(location.search);
  const clinicId = params.get("clinicId") || "";
  const serviceId = params.get("serviceId") || "";
  const date = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (clinicId && serviceId) {
      dispatch(
        fetchAvailability({ clinicId, serviceId, providerId: "any", date })
      );
    }
  }, [dispatch, clinicId, serviceId]);

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    dispatch(
      holdSlot({
        clinicId,
        serviceId,
        providerId: "any",
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    );
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    if (selectedSlot && user) {
      dispatch(
        createAppointment({
          clinicId,
          serviceId,
          providerId: "any",
          clientId: user.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          holdId,
          paymentMethod: "stripe",
          advancePaymentAmount: paymentIntent.amount,
        })
      ).then(() => navigate("/appointments"));
    }
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Available Slots</h3>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot: TimeSlot) => (
              <button
                key={slot.startTime}
                onClick={() => handleSelectSlot(slot)}
                className={`p-2 border rounded ${
                  selectedSlot?.startTime === slot.startTime
                    ? "bg-[#CBFF38]"
                    : ""
                }`}
              >
                {new Date(slot.startTime).toLocaleTimeString()}
              </button>
            ))}
          </div>
          {selectedSlot && (
            <PaymentForm amount={1000} onSuccess={handlePaymentSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};
