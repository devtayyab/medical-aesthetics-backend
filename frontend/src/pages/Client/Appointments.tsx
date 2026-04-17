import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import { 
  CalendarDays, Clock, MapPin, X, Edit3, 
  MessageSquare, Star, CreditCard, ChevronLeft, ArrowRight,
  Filter, CheckCircle2, AlertCircle, Plus
} from "lucide-react";
import { fetchUserAppointments, cancelAppointment } from "@/store/slices/bookingSlice";
import { bookingAPI } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

import { RootState, AppDispatch } from "@/store";
import { Appointment, AppointmentStatus } from "@/types";
import { RescheduleModal } from "@/components/organisms/RescheduleModal";

// Aesthetic Assets
import HeroBg from "@/assets/Appointments_Hero.png";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
  padding-bottom: 120px;
`;

const glassCard = css`
  background: white;
  border-radius: 32px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.03);
  border: 1px solid #F1F5F9;
  padding: 30px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #CBFF38;
    transform: translateY(-5px);
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.06);
  }
`;

const filterTab = (active: boolean) => css`
  padding: 10px 24px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
  background: ${active ? '#CBFF38' : '#F8F9FA'};
  color: ${active ? '#000' : '#94A3B8'};
  border: 1px solid ${active ? '#CBFF38' : 'transparent'};
  white-space: nowrap;

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
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: ${bg};
    color: ${color};
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

  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');

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
      window.alert("Cancellations are not allowed within 24 hours of the appointment.");
      return;
    }
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      await dispatch(cancelAppointment(apt.id));
      dispatch(fetchUserAppointments());
    }
  };

  const handleRescheduleClick = (apt: Appointment) => {
    if (isPastCutoff(apt.startTime)) {
      window.alert("Rescheduling is not allowed within 24 hours.");
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

  const allAppointments = bookingAppointments.length > 0 ? bookingAppointments : clientAppointments;
  
  const filteredAppointments = allAppointments.filter(apt => {
    if (activeFilter === 'all') return true;
    return apt.status.toLowerCase() === activeFilter;
  });

  return (
    <div className={sectionStyles}>
      {/* Premium Clinical Hero */}
      <div className="relative pt-24 pb-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={HeroBg} 
            style={{ objectPosition: 'center 40%' }}
            className="w-full h-full object-cover opacity-[0.25]" 
            alt="Hero background" 
          />
        </div>

        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-8 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic"
            >
              <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">DASHBOARD</Link>
              <span className="text-lime-500"> MY_RESERVATIONS</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
                 MY <span className="text-[#CBFF38]">APPOINTMENTS</span>
            </h1>
            
            <p className="text-gray-500 mt-8 font-bold text-base max-w-xl italic">
              Manage your active reservations, track your aesthetic journey, and secure your next time slot.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 relative z-20 -mt-[180px]">
        {/* Filters Grid */}
        <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
            <button onClick={() => setActiveFilter('all')} className={filterTab(activeFilter === 'all')}>All</button>
            <button onClick={() => setActiveFilter('confirmed')} className={filterTab(activeFilter === 'confirmed')}>Scheduled</button>
            <button onClick={() => setActiveFilter('completed')} className={filterTab(activeFilter === 'completed')}>Completed</button>
            <button onClick={() => setActiveFilter('cancelled')} className={filterTab(activeFilter === 'cancelled')}>Cancelled</button>
        </div>

        {filteredAppointments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-2xl"
          >
             <div className="size-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10">
                <CalendarDays className="text-gray-200" size={40} />
             </div>
             <h3 className="text-2xl font-black uppercase italic text-gray-900 mb-4">No records found</h3>
             <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-10 italic">Your aesthetic calendar is currently clear.</p>
             <Link to="/search">
               <button className="px-12 h-16 bg-black text-[#CBFF38] text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-lime-500 hover:text-black transition-all shadow-2xl italic">
                  Book New Reservation
               </button>
             </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[14px] font-black uppercase tracking-tight text-gray-900 leading-none mb-1">
                          {apt.clinic?.name || "B&D Elite Clinic"}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Premium Partner</p>
                      </div>
                    </div>
                    
                    <div className={statusBadgeStyle(apt.status)}>
                       {apt.status === 'CONFIRMED' && <CheckCircle2 size={12} />}
                       {apt.status === 'CANCELLED' && <AlertCircle size={12} />}
                       {apt.status}
                    </div>
                  </div>

                  {/* Treatment Detail */}
                  <div className="mb-10 min-h-[80px]">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 italic">Selected Procedure</p>
                    <h3 className="text-2xl font-black uppercase italic text-gray-900 tracking-tighter leading-tight">
                      {(apt as any).serviceName || apt.service?.treatment?.name || "Aesthetic Protocol"}
                    </h3>
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-10 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <div className="flex flex-col gap-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Date</span>
                       <div className="flex items-center gap-2 text-gray-900 font-black text-[11px] uppercase italic">
                          <CalendarDays size={14} className="text-lime-500" />
                          {new Date(apt.startTime).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Session Time</span>
                       <div className="flex items-center gap-2 text-gray-900 font-black text-[11px] uppercase italic">
                          <Clock size={14} className="text-lime-500" />
                          {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                       </div>
                    </div>
                  </div>

                  {/* Action Center */}
                  <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                    <div className="flex gap-3">
                        {apt.status.toLowerCase() === 'completed' && (
                          <button onClick={() => navigate('/reviews')} className="size-11 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center hover:bg-yellow-105 transition-all" title="Rate Clinical Experience">
                            <Star size={18} />
                          </button>
                        )}
                        {apt.status.toLowerCase() !== 'cancelled' && apt.status.toLowerCase() !== 'completed' && (
                          <>
                            <button onClick={() => handleRescheduleClick(apt)} className="size-11 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center hover:bg-lime-500 hover:text-black transition-all shadow-lg" title="Adjust Reservation">
                              <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleCancelClick(apt)} className="size-11 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all" title="Recall Reservation">
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {apt.status === 'PENDING_PAYMENT' as any && (
                           <button onClick={() => handleRetryPayment(apt)} className="h-11 px-6 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic" title="Pay Now">
                             <CreditCard size={14} /> Pay Now
                           </button>
                        )}
                    </div>
                    
                    {apt.notes && (
                      <div className="group relative">
                        <MessageSquare className="text-gray-200 hover:text-lime-500 transition-colors cursor-help" size={20} />
                        <div className="absolute bottom-full right-0 mb-3 w-56 p-4 bg-black text-white text-[10px] font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none z-30 shadow-2xl border border-white/10 leading-relaxed italic">
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
          className="fixed bottom-10 right-10 z-[100]"
        >
           <button 
             onClick={() => navigate('/search')}
             className="size-20 bg-[#CBFF38] text-black rounded-full shadow-[0_20px_40px_rgba(203,255,56,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
           >
              <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
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
      <footer className="container mx-auto px-8 py-20 mt-20 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-10">
              <Link to="/support" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-black transition-colors italic">Patient Concierge</Link>
              <Link to="/legal" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-black transition-colors italic">Privacy Compliance</Link>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-200 italic">© 2026 BEAUTY_DOCTORS_PROTOCOL</p>
      </footer>
    </div>
  );
};
