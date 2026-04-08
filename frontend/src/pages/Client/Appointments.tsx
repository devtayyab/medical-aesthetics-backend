import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaClinicMedical, 
  FaTimes, 
  FaEdit, 
  FaRegCommentDots, 
  FaStar, 
  FaCreditCard,
  FaChevronLeft
} from "react-icons/fa";
import { fetchUserAppointments, cancelAppointment } from "@/store/slices/bookingSlice";
import { bookingAPI } from "@/services/api";

import { RootState, AppDispatch } from "@/store";
import { Appointment, AppointmentStatus } from "@/types";
import { RescheduleModal } from "@/components/organisms/RescheduleModal";

const sectionStyles = css`
  min-height: 100vh;
  background: #F8F9FA;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(0, 0, 0, 0.02) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const appointmentCard = css`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 24px;
  padding: 24px;
  @media (min-width: 768px) {
    border-radius: 28px;
    padding: 32px;
  }
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #CBFF38;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
  }
`;

const statusBadge = (status: string) => {
  let bg = "#F1F5F9";
  let color = "#64748B";
  let border = "#E2E8F0";

  switch (status.toLowerCase()) {
    case 'confirmed':
      bg = "#ECFDF5";
      color = "#059669";
      border = "#D1FAE5";
      break;
    case 'pending':
    case 'pending_payment':
      bg = "#FFFBEB";
      color = "#D97706";
      border = "#FEF3C7";
      break;
    case 'completed':
      bg = "#F0F9FF";
      color = "#0284C7";
      border = "#E0F2FE";
      break;
    case 'cancelled':
      bg = "#FEF2F2";
      color = "#DC2626";
      border = "#FEE2E2";
      break;
  }

  return css`
    padding: 6px 14px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: ${bg};
    color: ${color};
    border: 1px solid ${border};
    display: inline-flex;
    align-items: center;
    gap: 6px;
  `;
};

export const Appointments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { appointments: bookingAppointments } = useSelector((state: RootState) => state.booking);
  const { appointments: clientAppointments } = useSelector((state: RootState) => state.client);

  const [reschedulingAppointment, setReschedulingAppointment] = React.useState<Appointment | null>(null);

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  const isPastCutoff = (startTime: string) => {
    const aptTime = new Date(startTime).getTime();
    const now = new Date().getTime();
    const _24Hours = 24 * 60 * 60 * 1000;
    return (aptTime - now) < _24Hours;
  };

  const handleCancelClick = async (apt: Appointment) => {
    if (isPastCutoff(apt.startTime)) {
      window.alert("Cancellations are not allowed within 24 hours of the appointment. Please contact the clinic directly.");
      return;
    }
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      await dispatch(cancelAppointment(apt.id));
      if (apt.paymentMethod === 'card' || (apt.advancePaymentAmount && apt.advancePaymentAmount > 0)) {
        window.alert("Your reservation has been CANCELED. Automated refund flow initiated (3-5 business days).");
      }
      dispatch(fetchUserAppointments());
    }
  };

  const handleRescheduleClick = (apt: Appointment) => {
    if (isPastCutoff(apt.startTime)) {
      window.alert("Rescheduling is not allowed within 24 hours of the appointment.");
      return;
    }
    setReschedulingAppointment(apt);
  };

  const handleRetryPayment = async (apt: Appointment) => {
    try {
      const res = await bookingAPI.getAppointment(apt.id);
      const redirectUrl = (res.data as any)?.redirectUrl;
      if (redirectUrl) window.location.href = redirectUrl;
    } catch (err) {
      window.alert('Failed to retrieve payment link.');
    }
  };

  const appointments = bookingAppointments.length > 0 ? bookingAppointments : clientAppointments;

  return (
    <section className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-24 md:pt-24 md:pb-48 px-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#CBFF38] transition-all mb-6 md:mb-8">
            <FaChevronLeft size={10} /> Back
          </button>
          <h1 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-3 md:mb-4">
            My Reservations
          </h1>
          <p className="text-gray-400 font-medium tracking-wide border-l-2 border-[#CBFF38] pl-4 uppercase text-[9px] md:text-xs">
            Manage your aesthetic journey and upcoming clinic visits.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 md:-mt-32">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-[32px] p-16 text-center shadow-sm border border-gray-100">
             <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCalendarAlt className="text-gray-300" size={32} />
             </div>
             <h3 className="text-xl font-black uppercase italic text-gray-900 mb-2">No bookings yet</h3>
             <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide mb-8">Ready for your transformation?</p>
             <button onClick={() => navigate('/search')} className="px-8 py-4 bg-[#CBFF38] text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:shadow-lg transition-all">
                Book Treatment
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {appointments.map((apt: Appointment) => (
              <div key={apt.id} className={appointmentCard}>
                {/* Header: Clinic & Status */}
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#1A1A1A]">
                        <FaClinicMedical size={18} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-none">
                        {apt.clinic?.name || "B&D Clinic"}
                      </h3>
                   </div>
                   {apt.status === 'pending_payment' as any ? (
                      <button 
                        onClick={() => handleRetryPayment(apt)}
                        className={`${statusBadge('pending_payment')} cursor-pointer hover:scale-105 transition-transform`}
                      >
                        <FaCreditCard size={10} /> Pay Now
                      </button>
                   ) : (
                      <span className={statusBadge(apt.status)}>{apt.status}</span>
                   )}
                </div>

                {/* Service Detail */}
                <div className="mb-8">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Selected Treatment</p>
                   <p className="text-lg md:text-xl font-black uppercase italic text-gray-900 tracking-tighter leading-tight">
                     {(apt as any).serviceName || apt.service?.treatment?.name || "Aesthetic Service"}
                   </p>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl mb-8">
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-[10px] md:text-xs uppercase italic whitespace-nowrap">
                         <FaCalendarAlt size={10} className="text-[#CBFF38]" />
                         {new Date(apt.startTime).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Time</span>
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-[10px] md:text-xs uppercase italic">
                         <FaClock size={10} className="text-[#CBFF38]" />
                         {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex gap-2">
                      {(apt.status as any) === AppointmentStatus.COMPLETED && (
                        <button onClick={() => navigate('/reviews')} className="size-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center hover:bg-yellow-100 transition-colors" title="Leave Review">
                          <FaStar size={14} />
                        </button>
                      )}
                      {(apt.status as any) !== AppointmentStatus.CANCELLED && (apt.status as any) !== AppointmentStatus.COMPLETED && (
                        <>
                          <button onClick={() => handleRescheduleClick(apt)} className="size-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all" title="Reschedule">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => handleCancelClick(apt)} className="size-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all" title="Cancel Reservation">
                            <FaTimes size={14} />
                          </button>
                        </>
                      )}
                    </div>
                    {apt.notes && (
                      <div className="group relative">
                        <FaRegCommentDots className="text-gray-300 hover:text-[#CBFF38] transition-colors cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                           {apt.notes}
                        </div>
                      </div>
                    )}
                </div>
              </div>
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
