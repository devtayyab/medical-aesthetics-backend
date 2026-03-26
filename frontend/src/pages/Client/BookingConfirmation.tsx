import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import { FaCheckCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronLeft, FaStar, FaShareAlt, FaCalendarPlus } from "react-icons/fa";
import { css } from "@emotion/css";
import { format } from "date-fns";

const containerStyle = css`
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 1rem;
`;

const successCard = css`
  background: white;
  border-radius: 32px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
`;

const detailRow = css`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fdfdfd;
  border-radius: 16px;
  border: 1px solid #f7f7f7;
`;

interface Appointment {
  id: string;
  clinicId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName?: string;
  clinic?: {
    name: string;
  };
  service?: {
    name: string;
  };
  clientDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
}

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.appointment) {
      setAppointment(location.state.appointment);
    } else {
      navigate('/search');
    }
    setIsLoading(false);
  }, [location.state, navigate]);

  if (isLoading || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC]">
        <div className="text-sm font-black uppercase tracking-tighter text-gray-400 animate-pulse">
          Finalizing Details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <div className={containerStyle}>
        <div className="mb-12">
          <button onClick={() => navigate('/search')} className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
            <div className="size-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-all">
              <FaChevronLeft size={10} />
            </div>
            Back to Discovery
          </button>
        </div>

        <div className={successCard}>
          <div className="absolute top-0 left-0 w-full h-2 bg-[#CBFF38]" />

          <div className="relative mb-8">
            <div className="size-24 rounded-full bg-lime-50 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
              <FaCheckCircle className="text-[#CBFF38]" size={48} />
            </div>
            <div className="absolute -top-2 -right-2 size-8 bg-black text-white rounded-full flex items-center justify-center animate-bounce">
              <FaStar size={12} className="text-[#CBFF38]" />
            </div>
          </div>

          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-gray-900 mb-4 px-4">
            {appointment.status === 'PENDING' ? 'Request Received!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-12">
            Status: {appointment.status === 'PENDING' ? 'Pending Staff Confirmation' : 'Confirmed'}
          </p>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-12">
            Reference: #{appointment.id.slice(-8).toUpperCase()}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 text-left">
            <div className={detailRow}>
              <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</p>
                <p className="font-black text-black uppercase italic">
                  {format(new Date(appointment.startTime), "EEEE, MMM d")}
                </p>
              </div>
            </div>

            <div className={detailRow}>
              <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                <FaClock className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time</p>
                <p className="font-black text-black uppercase italic">
                  {format(new Date(appointment.startTime), "HH:mm")}
                </p>
              </div>
            </div>

            <div className={`${detailRow} md:col-span-2`}>
              <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                <FaMapMarkerAlt className="text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Appointment Details</p>
                <p className="font-black text-black uppercase italic truncate">{appointment.service?.name || appointment.serviceName || 'Treatment'}</p>
                <p className="text-xs font-bold text-gray-500">{appointment.clinic?.name || 'Clinic'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-12 border-t border-gray-100 pt-12">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">What happens next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="size-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-xs mx-auto mb-4">1</div>
                <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">Confirmation <br /> Email Sent</p>
              </div>
              <div>
                <div className="size-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-xs mx-auto mb-4">2</div>
                <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">Sync to <br /> Your Calendar</p>
              </div>
              <div>
                <div className="size-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-xs mx-auto mb-4">3</div>
                <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">Arrival 10m <br /> Prior Treatment</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              fullWidth
              className="bg-[#CBFF38] text-black hover:bg-lime-400 h-16 rounded-2xl font-black uppercase tracking-widest text-sm"
              onClick={() => navigate('/appointments')}
            >
              Manage Booking
            </Button>
            <div className="flex gap-4 flex-1">
              <Button variant="outline" className="flex-1 h-16 rounded-2xl border-gray-200 hover:border-black transition-all">
                <FaShareAlt />
              </Button>
              <Button variant="outline" className="flex-1 h-16 rounded-2xl border-gray-200 hover:border-black transition-all">
                <FaCalendarPlus />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/search" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all border-b border-gray-200 pb-1">
            Book another treatment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
