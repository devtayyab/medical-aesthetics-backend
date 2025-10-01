import React, { useState, useEffect } from "react";
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
} from "@/store/slices/bookingSlice";
import { fetchClinicServices } from "@/store/slices/clientSlice";
import { RootState, AppDispatch } from "@/store";
import type { Clinic, Service, TimeSlot } from "@/types";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";

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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
`;

const titleStyle = css`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
`;

const tabsStyle = css`
  display: flex;
  gap: 1rem;
`;

const tabButtonStyle = css`
  background: #ffffff;
  color: #2d3748;
  border-radius: 12px;
  padding: 12px 22px;
  border: 1px solid #2d3748;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #2d3748 !important;
    color: #ffffff !important;
  }
`;

const sectionStyle = css`
  margin: 2rem 0;
  position: relative;
  z-index: 1;
`;

const waveSectionStyle = css`
  background-color: #f0f8ff;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;
  text-align: center;
  color: #2d3748;
  position: relative;
  z-index: 1;
`;

export const AppointmentBooking: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    availableSlots,
    holdId,
    isLoading,
    error,
    selectedServices,
    selectedClinic,
  } = useSelector((state: RootState) => state.booking);
  const { services, clinics } = useSelector((state: RootState) => state.client);
  const clinicId = searchParams.get("clinicId");
  const serviceIds = searchParams.get("serviceIds")?.split(",") || [];

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Use selectedClinic from Redux or find from clinics array if not set
  const clinic = selectedClinic || clinics.find((c) => c.id === clinicId);

  useEffect(() => {
    if (clinicId) {
      // Set selectedClinic from clinics array or fetch if not available
      const clinicData = clinics.find((c) => c.id === clinicId);
      if (clinicData) {
        dispatch(setSelectedClinic(clinicData));
      } else {
        dispatch(fetchClinicById(clinicId)); // Fetch if not in initial state
      }
      if (serviceIds.length > 0) {
        const servicesToAdd = services.filter((s) => serviceIds.includes(s.id));
        servicesToAdd.forEach((service) => dispatch(addService(service)));
      }
      dispatch(fetchClinicServices(clinicId));
    }
  }, [dispatch, clinicId, serviceIds, clinics]);

  useEffect(() => {
    if (clinicId && serviceIds.length > 0) {
      dispatch(
        fetchAvailability({
          clinicId,
          serviceId: serviceIds[0], // Use the first service for availability
          providerId: "provider1",
          date: new Date().toISOString().split("T")[0],
        })
      );
    }
  }, [dispatch, clinicId, serviceIds]);

  const handleHoldSlot = async () => {
    if (clinicId && serviceIds.length > 0 && selectedSlot) {
      const [startTime, endTime] = selectedSlot.split(" - ");
      const response = await dispatch(
        holdTimeSlot({
          clinicId,
          serviceId: serviceIds[0],
          providerId: "provider1",
          startTime,
          endTime,
        })
      ).unwrap();
      console.log("Slot held:", response);
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
            providerId: "provider1",
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

  return (
    <div className={containerStyle}>
      <div className={layeredBGStyle} />
      <div className={headerStyle}>
        <h2 className={titleStyle}>Book Appointment</h2>
        <div className={tabsStyle}>
          <Button className={tabButtonStyle}>Availability</Button>
          <Button className={tabButtonStyle}>Confirmation</Button>
        </div>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className={sectionStyle}>
        {clinic && (
          <>
            <p>
              <strong>Clinic:</strong> {clinic.name}
            </p>
            {selectedServices.length > 0 && (
              <div>
                <strong>Selected Services:</strong>
                <ul className="list-disc pl-5 mt-2">
                  {selectedServices.map((service) => (
                    <li key={service.id} className="text-gray-700">
                      {service.name} - ${service.price} (
                      {service.durationMinutes} min)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* <p>
              <strong>Address:</strong> {clinic.address.street},{" "}
              {clinic.address.city}, {clinic.address.state},{" "}
              {clinic.address.zipCode}, {clinic.address.country}
            </p>
            <p>
              <strong>Phone:</strong> {clinic.phone}
            </p>
            <p>
              <strong>Email:</strong> {clinic.email}
            </p> */}
          </>
        )}
      </div>
      <div className={sectionStyle}>
        <Button
          onClick={() =>
            dispatch(
              fetchAvailability({
                clinicId: clinicId || "1",
                serviceId: serviceIds[0] || "1",
                providerId: "provider1",
                date: new Date().toISOString().split("T")[0],
              })
            )
          }
          disabled={isLoading}
          className="mb-4"
        >
          Check Availability
        </Button>
        {availableSlots.length > 0 || !isLoading ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Time Slot
            </label>
            <select
              value={selectedSlot || ""}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select Time Slot
              </option>
              {(availableSlots.length > 0 ? availableSlots : [])
                .filter((s) => s.available)
                .map((s) => (
                  <option
                    key={s.startTime}
                    value={`${s.startTime} - ${s.endTime}`}
                  >
                    {`${new Date(s.startTime).toLocaleTimeString()} - ${new Date(
                      s.endTime
                    ).toLocaleTimeString()}`}
                  </option>
                ))}
            </select>
            <Button
              onClick={handleHoldSlot}
              disabled={!selectedSlot || isLoading}
              className="mt-4 mb-4"
            >
              Hold Slot
            </Button>
          </div>
        ) : (
          <p className="text-gray-500">No slots available yet.</p>
        )}
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="mb-4"
        />
        <Button
          onClick={handleBookAppointment}
          disabled={!holdId || isLoading}
          className="mb-4"
        >
          Confirm Booking
        </Button>
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
          className="mt-4"
        >
          Back
        </Button>
      </div>
      {/* <div className={waveSectionStyle}>
        <h3>Need help with booking?</h3>
        <p>Contact support for assistance</p>
      </div> */}
    </div>
  );
};
