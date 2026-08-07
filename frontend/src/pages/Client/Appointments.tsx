import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import { 
  CalendarDays, Clock, MapPin, X, Edit3, 
  MessageSquare, Star, CreditCard, 
  CheckCircle2, AlertCircle, Plus
} from "lucide-react";
import { fetchUserAppointments, cancelAppointment } from "@/store/slices/bookingSlice";
import { bookingAPI } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { RootState, AppDispatch } from "@/store";
import { Appointment } from "@/types";
import { RescheduleModal } from "@/components/organisms/RescheduleModal";

// Aesthetic Assets
import HeroBg from "@/assets/Appointments_Hero.png";

const formatClinicTime = (dateStr: string | Date, timezone?: string) => {
  const d = new Date(dateStr);
  try {
    if (!timezone) throw new Error("No timezone");
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
};

const formatClinicDate = (dateStr: string | Date, timezone?: string) => {
  const d = new Date(dateStr);
  try {
    if (!timezone) throw new Error("No timezone");
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return formatter.format(d);
  } catch {
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }
};

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
  padding-bottom: 80px;
  @media (min-width: 640px) {
    padding-bottom: 120px;
  }
`;

const glassCard = css`
  background: white;
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.03);
  border: 1px solid #F1F5F9;
  padding: 16px;
  @media (min-width: 640px) {
    border-radius: 32px;
    padding: 28px;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.03);
  }
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #CBFF38;
    transform: translateY(-4px);
    box-shadow: 0 40px 90px rgba(0, 0, 0, 0.06);
  }
`;

const filterTab = (active: boolean) => css`
  padding: 10px 20px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
  background: ${active ? '#CBFF38' : '#F8F9FA'};
  color: ${active ? '#000' : '#94A3B8'};
  border: 1px solid ${active ? '#CBFF38' : 'transparent'};
  white-space: nowrap;
  min-height: 40px;

  @media (min-width: 640px) {
    padding: 10px 24px;
    font-size: 11px;
  }

  &:hover {
    background: ${active ? '#CBFF38' : '#F1F5F9'};
    color: ${active ? '#000' : '#475569'};
  }
`;

const statusBadgeStyle = (status: string) => {
  let bg = "#F8F9FA";
  let color = "#94A3B8";
  
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      bg = "#CBFF38";
      color = "#000";
      break;
    case 'pending':
    case 'pending_payment':
      bg = "#FFF9C4";
      color = "#827717";
      break;
    case 'cancelled':
      bg = "#FEE2E2";
      color = "#DC2626";
      break;
  }

  return css`
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: ${bg};
    color: ${color};
    display: inline-flex;
    align-items: center;
    gap: 4px;

    @media (min-width: 640px) {
      padding: 6px 12px;
      font-size: 9px;
      gap: 6px;
    }
  `;
};

export const Appointments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { appointments: bookingAppointments } = useSelector((state: RootState) => state.booking);
  const { appointments: clientAppointments } = useSelector((state: RootState) => state.client);

  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'completed'>('confirmed');

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  const handleCancelClick = async (apt: Appointment) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      try {
        await dispatch(cancelAppointment(apt.id)).unwrap();
        toast.success("Appointment cancelled");
      } catch (err: any) {
        toast.error(err?.message || "Could not cancel this appointment. Please try again or contact the clinic.");
      } finally {
        dispatch(fetchUserAppointments());
      }
    }
  };

  const handleRescheduleClick = (apt: Appointment) => {
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

  const allAppointments = bookingAppointments.length > 0 ? bookingAppointments : clientAppointments;
  const filteredAppointments = allAppointments.filter(apt => {
    const status = apt.status.toLowerCase();
    if (status === 'cancelled' || status === 'no_show') return false;
    
    const isPast = new Date(apt.startTime).getTime() < new Date().getTime();

    if (status === 'pending' && isPast) return false;

    if (activeFilter === 'confirmed') {
      if (isPast) return false;
      return ['confirmed', 'pending', 'pending_payment'].includes(status);
    }

    if (activeFilter === 'all') return true;
    return status === activeFilter;
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className={`${sectionStyles} w-full overflow-x-hidden`}>
      {/* Hero */}
      <div className="relative pt-16 sm:pt-24 pb-32 sm:pb-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={HeroBg} 
            style={{ objectPosition: 'center 40%' }}
            className="w-full h-full object-cover opacity-[0.25]" 
            alt="Hero background" 
          />
        </div>

        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8 text-gray-400 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]"
            >
              <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">DASHBOARD</Link>
              <span className="text-lime-500"> MY_RESERVATIONS</span>
            </motion.div>
            
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-gray-900">
              MY <span className="text-[#CBFF38]">APPOINTMENTS</span>
            </h1>
            
            <p className="text-gray-500 mt-4 sm:mt-6 font-bold text-xs sm:text-base max-w-xl">
              Manage your active reservations, track your aesthetic journey, and secure your next time slot.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 relative z-20 -mt-[90px] sm:-mt-[160px]">
        {/* Filters Grid */}
        <div className="flex items-center gap-3 mb-6 sm:mb-10 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setActiveFilter('all')} className={filterTab(activeFilter === 'all')}>All</button>
          <button onClick={() => setActiveFilter('confirmed')} className={filterTab(activeFilter === 'confirmed')}>Scheduled</button>
          <button onClick={() => setActiveFilter('completed')} className={filterTab(activeFilter === 'completed')}>Completed</button>
        </div>

        {filteredAppointments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl sm:rounded-[40px] p-8 sm:p-20 text-center border border-gray-100 shadow-xl"
          >
            <div className="size-16 sm:size-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <CalendarDays className="text-gray-200" size={32} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-8">Your aesthetic calendar is currently clear.</p>
            <Link to="/search">
              <button className="px-8 sm:px-12 h-12 sm:h-16 bg-black text-[#CBFF38] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-lime-500 hover:text-black transition-all shadow-xl min-h-[44px]">
                Book New Reservation
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt: Appointment) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={apt.id} 
                  className={glassCard}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6 sm:mb-8 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 sm:size-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[14px] font-black uppercase tracking-tight text-gray-900 leading-none mb-1 truncate">
                          {apt.clinic?.name || "B&D Elite Clinic"}
                        </p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">Premium Partner</p>
                      </div>
                    </div>
                    
                    <div className={statusBadgeStyle(apt.status)}>
                      {apt.status === 'CONFIRMED' && <CheckCircle2 size={12} />}
                      {apt.status === 'CANCELLED' && <AlertCircle size={12} />}
                      {apt.status}
                    </div>
                  </div>

                  {/* Treatment Detail */}
                  <div className="mb-6 sm:mb-8 min-h-[60px] sm:min-h-[80px]">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Selected Procedure</p>
                    <h3 className="text-lg sm:text-2xl font-black uppercase text-gray-900 tracking-tighter leading-tight line-clamp-2">
                      {(apt as any).serviceName || apt.service?.treatment?.name || "Aesthetic Protocol"}
                    </h3>
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8 bg-gray-50/50 p-3 sm:p-5 rounded-2xl border border-gray-100">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Date</span>
                      <div className="flex items-center gap-1.5 text-gray-900 font-black text-[10px] sm:text-[11px] uppercase truncate">
                        <CalendarDays size={14} className="text-lime-500 shrink-0" />
                        <span className="truncate">{formatClinicDate(apt.startTime, apt.clinic?.timezone)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Session Time</span>
                      <div className="flex items-center gap-1.5 text-gray-900 font-black text-[10px] sm:text-[11px] uppercase truncate">
                        <Clock size={14} className="text-lime-500 shrink-0" />
                        <span className="truncate">{formatClinicTime(apt.startTime, apt.clinic?.timezone)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Center */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex gap-2.5 sm:gap-3">
                      {apt.status.toLowerCase() === 'completed' && (
                        <button onClick={() => navigate('/reviews')} className="size-10 sm:size-11 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center hover:bg-yellow-100 transition-all min-h-[44px] min-w-[44px]" title="Rate Clinical Experience">
                          <Star size={18} />
                        </button>
                      )}
                      {apt.status.toLowerCase() !== 'cancelled' && apt.status.toLowerCase() !== 'completed' && (
                        <>
                          <button onClick={() => handleRescheduleClick(apt)} className="size-10 sm:size-11 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center hover:bg-lime-500 hover:text-black transition-all shadow-md min-h-[44px] min-w-[44px]" title="Adjust Reservation">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleCancelClick(apt)} className="size-10 sm:size-11 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all min-h-[44px] min-w-[44px]" title="Recall Reservation">
                            <X size={18} />
                          </button>
                        </>
                      )}
                      {apt.status === 'PENDING_PAYMENT' as any && (
                        <button onClick={() => handleRetryPayment(apt)} className="h-10 sm:h-11 px-4 sm:px-6 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest min-h-[44px]" title="Pay Now">
                          <CreditCard size={14} /> Pay Now
                        </button>
                      )}
                    </div>
                    
                    {apt.notes && (
                      <div className="group relative">
                        <MessageSquare className="text-gray-300 hover:text-lime-500 transition-colors cursor-help" size={20} />
                        <div className="absolute bottom-full right-0 mb-3 w-48 sm:w-56 p-3 sm:p-4 bg-black text-white text-[10px] font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none z-30 shadow-2xl border border-white/10 leading-relaxed">
                          <span className="block text-lime-500 font-black mb-1">CLINICAL_NOTES:</span>
                          {apt.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Floating Add Button For Active Users */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-[100]"
        >
          <button 
            onClick={() => navigate('/search')}
            className="size-14 sm:size-20 bg-[#CBFF38] text-black rounded-full shadow-[0_16px_36px_rgba(203,255,56,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all group min-h-[44px] min-w-[44px]"
            aria-label="Book new appointment"
          >
            <Plus size={28} className="group-hover:rotate-90 transition-transform duration-500 sm:size-[32px]" />
          </button>
        </motion.div>
      </main>

      {reschedulingAppointment && (
        <RescheduleModal
          isOpen={!!reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          appointment={reschedulingAppointment}
        />
      )}

      {/* Footer Branding */}
      <footer className="container mx-auto px-4 sm:px-8 py-8 sm:py-16 mt-8 sm:mt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-6 sm:gap-10">
          <Link to="/support" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">Patient Concierge</Link>
          <Link to="/legal" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">Privacy Compliance</Link>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">© 2026 BEAUTY_DOCTORS_PROTOCOL</p>
      </footer>
    </div>
  );
};
