import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { css } from "@emotion/css";
import { FaCalendarAlt, FaClock, FaClinicMedical, FaLongArrowAltRight } from "react-icons/fa";
import { MdNotes, MdOutlinePendingActions } from "react-icons/md";
import { fetchUserAppointments } from "@/store/slices/bookingSlice";
import { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { Card } from "@/components/atoms/Card/Card";
import LayeredBG from "@/assets/LayeredBg.svg";
import { Link } from "react-router-dom";
import { Fa7, FaArrowRightLong, FaChevronRight } from "react-icons/fa6";
import EmptyIcon from "@/assets/Icons/Rectangle.png";
import { Button } from "@/components/atoms/Button/Button";
import { useNavigate } from "react-router-dom";

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
  // max-width: 900px;
  margin: 0 auto;
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
  font-size: 16px;
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
  const { user } = useSelector(
    (state: RootState) => state.auth
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

        <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
          <Link
            to="/my-account"
            className="hover:text-[#405C0B] transition-colors"
          >
            Account
          </Link>
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          Booking
        </div>

        {/* Title */}
        <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
          Bookings
        </h2>


        {appointments.length === 0 ? (
          <>
            <div className="flex flex-col items-center justify-center gap-6">
              <img src={EmptyIcon} alt="" className="" />
              <div>
                <p className="text-[#33373F] text-[22px] font-semibold text-center">You have no upcoming bookings</p>
                <p className={emptyState}>
                  Get treated. Why not book something now?
                </p>
              </div>
              <Button
                className="text-[18px] text-[#405C0B] border-[#5F8B00] hover:border-transparent rounded-[12px]"
                variant="outline"
                rightIcon={<FaArrowRightLong size={11} className="pt-[1px] text-[#767676]" />}
              >
                Browse our treatments
              </Button>
            </div>
            <div className="flex flex-col gap-2 items-center mt-[7rem]  ">
              <p className="text-[#717171] text-[16px]">
                Looking for a booking you’ve made before?
              </p>
              <p className="text-[#717171] text-[16px]">
                You’re signed in with;
              </p>
              <p className="text-[#717171] text-[16px]">
                {user?.email}
              </p>
            </div>
          </>

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
