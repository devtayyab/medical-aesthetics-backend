import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { css } from "@emotion/css";
import { FaCalendarAlt, FaClock, FaClinicMedical } from "react-icons/fa";
import { MdNotes, MdOutlinePendingActions } from "react-icons/md";
import { fetchUserAppointments } from "@/store/slices/bookingSlice";
import { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { Card } from "@/components/atoms/Card/Card";
import LayeredBG from "@/assets/LayeredBg.svg";

const container = css`
  min-height: 100vh;
  background: #f9fafb;
  background-image: url(${LayeredBG});
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center top;
`;

const heading = css`
  font-size: 28px;
  font-weight: 700;
  color: #222;
  // text-align: center;
  margin-bottom: 40px;
`;

const cardGrid = css`
  display: grid;
  gap: 20px;
  margin: 0 auto;
  grid-template-columns: 1fr;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const cardStyle = css`
  border-radius: 16px;
  padding: 20px 24px;
  background: #ffffffcc;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }
`;

const topSection = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const clinicName = css`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #222;
`;

const serviceName = css`
  font-size: 16px;
  color: #555;
  margin-bottom: 8px;
`;

const details = css`
  display: grid;
  gap: 8px;
  color: #444;
  font-size: 15px;
`;

const statusBadge = css`
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
  background-color: #eef2ff;
  color: #405c0b;
  border: 1px solid #5f8b00;
`;

const emptyState = css`
  text-align: center;
  color: #717171;
  font-size: 18px;
  margin-top: 40px;
`;

export const Appointments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    appointments: bookingAppointments,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.booking);
  const { appointments: clientAppointments } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  // Combine dummy data with fetched data
  const appointments =
    bookingAppointments.length > 0 ? bookingAppointments : clientAppointments;

  if (isLoading)
    return <div className="p-6 text-gray-500 text-center">Loading...</div>;

  if (error)
    return (
      <div className="p-6 text-red-500 text-center font-medium">{error}</div>
    );

  return (
    <section className={container}>
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <h2 className={heading}>My Appointments</h2>

        {appointments.length === 0 ? (
          <p className={emptyState}>
            You currently have no appointments booked.
          </p>
        ) : (
          <div className={cardGrid}>
            {appointments.map((apt: Appointment) => (
              <Card key={apt.id} className={cardStyle}>
                <div className={topSection}>
                  <div className={clinicName}>
                    <FaClinicMedical className="text-[#5F8B00]" size={20} />
                    {apt.clinic?.name || "Unnamed Clinic"}
                  </div>
                  <span className={statusBadge}>{apt.status}</span>
                </div>

                <p className={serviceName}>
                  <strong>Service:</strong> {apt.service?.name || "N/A"}
                </p>

                <div className={details}>
                  <p className="flex items-center gap-2">
                    <FaCalendarAlt className="text-[#405C0B]" size={16} />{" "}
                    <span>
                      {new Date(apt.startTime).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>

                  <p className="flex items-center gap-2">
                    <FaClock className="text-[#405C0B]" size={16} />{" "}
                    <span>
                      {new Date(apt.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(apt.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>

                  {apt.notes && (
                    <p className="flex items-center gap-2">
                      <MdNotes className="text-[#405C0B]" size={16} />{" "}
                      <span>{apt.notes}</span>
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
