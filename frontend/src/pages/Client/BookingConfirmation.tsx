import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import { FaCheckCircle, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronLeft, FaStar, FaShareAlt, FaCalendarPlus } from "react-icons/fa";
import { css } from "@emotion/css";
import { format } from "date-fns";

const containerStyle = css`
  max-width: 650px;
  margin: 0 auto;
  padding: 40px 1rem;
`;

const successCard = css`
  background: white;
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
`;

const detailRow = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
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
        <div className="mb-8">
          <button onClick={() => navigate('/search')} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
            <div className="size-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-black transition-all">
              <FaChevronLeft size={10} />
            </div>
            Back to Search
          </button>
        </div>

        <div className={successCard}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#CBFF38]" />

          <div className="relative mb-6">
            <div className="size-16 rounded-full bg-lime-50 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
              <FaCheckCircle className="text-[#CBFF38]" size={32} />
            </div>
            <div className="absolute -top-1 right-[calc(50%-2rem)] size-6 bg-black text-white rounded-full flex items-center justify-center animate-bounce shadow-xl">
              <FaStar size={10} className="text-[#CBFF38]" />
            </div>
          </div>

          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 mb-2 px-2">
            Booking Confirmed!
          </h1>
          <div className="flex justify-center gap-4 mb-8">
              <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.2em] bg-gray-50 px-3 py-1 rounded-md">
                Status: Confirmed
              </p>
              <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.2em] bg-gray-50 px-3 py-1 rounded-md">
                Ref: #{appointment.id.slice(-8).toUpperCase()}
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 text-left">
            <div className={detailRow}>
              <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <FaCalendarAlt className="text-gray-400" size={14} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</p>
                <p className="font-black text-black uppercase italic">
                  {format(new Date(appointment.startTime), "EEEE, MMM d")}
                </p>
              </div>
            </div>

            <div className={detailRow}>
              <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <FaClock className="text-gray-400" size={14} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time</p>
                <p className="font-black text-black uppercase italic">
                  {format(new Date(appointment.startTime), "HH:mm")}
                </p>
              </div>
            </div>

            <div className={`${detailRow} md:col-span-2`}>
              <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <FaMapMarkerAlt className="text-gray-400" size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Appointment Details</p>
                <p className="font-black text-black uppercase italic truncate text-sm">{appointment.service?.name || appointment.serviceName || 'Treatment'}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{appointment.clinic?.name || 'Clinic'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8 border-t border-gray-100 pt-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">What happens next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="size-6 rounded-full bg-[#121212] text-[#CBFF38] flex items-center justify-center font-black text-[10px] mx-auto mb-2">1</div>
                <p className="text-[9px] font-black uppercase tracking-tighter leading-tight text-gray-600">Confirmation <br /> Email Sent</p>
              </div>
              <div>
                <div className="size-6 rounded-full bg-[#121212] text-[#CBFF38] flex items-center justify-center font-black text-[10px] mx-auto mb-2">2</div>
                <p className="text-[9px] font-black uppercase tracking-tighter leading-tight text-gray-600">Sync to <br /> Your Calendar</p>
              </div>
              <div>
                <div className="size-6 rounded-full bg-[#121212] text-[#CBFF38] flex items-center justify-center font-black text-[10px] mx-auto mb-2">3</div>
                <p className="text-[9px] font-black uppercase tracking-tighter leading-tight text-gray-600">Arrival 10m <br /> Prior Treatment</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              fullWidth
              className="bg-[#121212] text-[#CBFF38] hover:bg-black h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
              onClick={() => navigate('/appointments')}
            >
              Manage Booking
            </Button>
            <div className="flex gap-3 flex-1">
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 hover:border-black hover:text-black transition-all">
                <FaShareAlt size={14}/>
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 hover:border-black hover:text-black transition-all">
                <FaCalendarPlus size={14}/>
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
