import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { FaCalendarAlt, FaClock, FaClinicMedical, FaTimes, FaEdit, FaRegCommentDots, FaStar } from "react-icons/fa";
import { MdNotes } from "react-icons/md";
import { fetchUserAppointments, cancelAppointment } from "@/store/slices/bookingSlice";

import { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { Card } from "@/components/atoms/Card/Card";
import { RescheduleModal } from "@/components/organisms/RescheduleModal";
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
  const navigate = useNavigate();
  const {
    appointments: bookingAppointments,
  } = useSelector((state: RootState) => state.booking);
  const { appointments: clientAppointments } = useSelector(
    (state: RootState) => state.client
  );

  const [reschedulingAppointment, setReschedulingAppointment] = React.useState<Appointment | null>(null);

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  const handleCancel = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      await dispatch(cancelAppointment(id));
      dispatch(fetchUserAppointments());
    }
  };

  const handleAddNote = (id: string, currentNote?: string) => {
    const note = window.prompt("Add a note for the clinic:", currentNote || "");
    if (note !== null && note !== currentNote) {
      // Dispatch update note action (Requires backend support, assumed handled via appointment update or separate endpoint)
      // For now, alerting limitation or we can implement updateAppointment if available.
      // Since updateAppointment isn't in slice, we will just log it.
      console.log(`Updating note for ${id}: ${note}`);
      // In real implementation: dispatch(updateAppointment({ id, notes: note }));
    }
  };

  // Combine dummy data with fetched data
  const appointments =
    bookingAppointments.length > 0 ? bookingAppointments : clientAppointments;



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

                <div className="flex gap-2 justify-end mb-4 border-b border-gray-100 pb-3">
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => handleAddNote(apt.id, apt.notes)}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Add Note"
                      >
                        <FaRegCommentDots />
                      </button>
                      <button
                        onClick={() => setReschedulingAppointment(apt)}
                        className="text-gray-500 hover:text-amber-600 p-2 rounded-full hover:bg-amber-50 transition-colors"
                        title="Reschedule"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Cancel Appointment"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                  {apt.status === 'completed' && (
                    <button
                      onClick={() => navigate('/reviews')}
                      className="text-gray-500 hover:text-yellow-500 p-2 rounded-full hover:bg-yellow-50 transition-colors"
                      title="Leave Review"
                    >
                      <FaStar />
                    </button>
                  )}
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

      {reschedulingAppointment && (
        <RescheduleModal
          isOpen={!!reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          appointment={reschedulingAppointment}
        />
      )}
    </section>
  );
};
