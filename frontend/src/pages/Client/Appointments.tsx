import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import { 
  CalendarDays, Clock, MapPin, Shield, X, Edit3, 
  MessageSquare, Star, CreditCard, 
  CheckCircle2, AlertCircle, Plus, ChevronRight, Sparkles
} from "lucide-react";
import { fetchUserAppointments, cancelAppointment } from "@/store/slices/bookingSlice";
import { bookingAPI } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { RootState, AppDispatch } from "@/store";
import { Appointment } from "@/types";
import { RescheduleModal } from "@/components/organisms/RescheduleModal";

// Luxury Clinic Assets
import HeroBg from "@/assets/Appointments_Hero.png";
import { formatDate, formatTime, APP_TIMEZONE } from "@/utils/formatters";

// Clinic wall-clock time (Europe/Athens by default), 24h and dd/mm/yyyy
const formatClinicTime = (dateStr: string | Date, timezone?: string) =>
  formatTime(dateStr, timezone && timezone !== 'null' ? timezone : APP_TIMEZONE);

const formatClinicDate = (dateStr: string | Date, timezone?: string) =>
  formatDate(dateStr, timezone && timezone !== 'null' ? timezone : APP_TIMEZONE);

const sectionStyles = css`
  min-height: 100vh;
  background: #F8FAFC;
  padding-bottom: 80px;
  @media (min-width: 640px) {
    padding-bottom: 120px;
  }
`;

const glassCard = css`
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 28px;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  padding: 20px;
  @media (min-width: 640px) {
    border-radius: 32px;
    padding: 28px;
  }
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.78);
    border-color: rgba(203, 255, 56, 0.7);
    transform: translateY(-4px);
    box-shadow: 0 30px 60px -10px rgba(203, 255, 56, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

const filterTab = (active: boolean) => css`
  padding: 10px 22px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${active ? '#CBFF38' : 'rgba(255, 255, 255, 0.65)'};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: ${active ? '#000000' : '#475569'};
  border: 1px solid ${active ? '#B6EF2B' : 'rgba(255, 255, 255, 0.85)'};
  box-shadow: ${active ? '0 10px 25px -5px rgba(203, 255, 56, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.03)'};
  white-space: nowrap;
  min-height: 42px;
  cursor: pointer;

  @media (min-width: 640px) {
    padding: 11px 26px;
    font-size: 11px;
  }

  &:hover {
    background: ${active ? '#CBFF38' : 'rgba(255, 255, 255, 0.9)'};
    color: #000000;
    transform: translateY(-1px);
  }
`;

const getAppointmentMeta = (apt: Appointment, isGreek: boolean) => {
  const isPast = new Date(apt.startTime).getTime() < Date.now();
  const rawStatus = (apt.status || '').toUpperCase();

  if (rawStatus === 'COMPLETED') {
    return {
      isPast,
      badgeText: isGreek ? 'ΟΛΟΚΛΗΡΩΜΕΝΟ' : 'COMPLETED',
      badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
      icon: <CheckCircle2 size={12} />,
    };
  }
  if (rawStatus === 'CANCELLED') {
    return {
      isPast,
      badgeText: isGreek ? 'ΑΚΥΡΩΜΕΝΟ' : 'CANCELLED',
      badgeClass: 'bg-red-500/15 text-red-700 border-red-500/30',
      icon: <AlertCircle size={12} />,
    };
  }
  if (rawStatus === 'NO_SHOW' || (apt as any).noShow) {
    return {
      isPast: true,
      badgeText: isGreek ? 'ΜΗ ΠΡΟΣΕΛΕΥΣΗ' : 'NO-SHOW',
      badgeClass: 'bg-gray-500/15 text-gray-700 border-gray-500/30',
      icon: <AlertCircle size={12} />,
    };
  }
  if (isPast) {
    if (rawStatus === 'PENDING_PAYMENT') {
      return {
        isPast: true,
        badgeText: isGreek ? 'ΕΚΠΝΕΥΣΕ' : 'EXPIRED',
        badgeClass: 'bg-gray-400/20 text-gray-600 border-gray-400/40',
        icon: <Clock size={12} />,
      };
    }
    if (rawStatus === 'CONFIRMED') {
      return {
        isPast: true,
        badgeText: isGreek ? 'ΕΚΚΡΕΜΕΙ ΕΠΑΛΗΘΕΥΣΗ' : 'PENDING VERIFICATION',
        badgeClass: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
        icon: <Clock size={12} />,
      };
    }
  }
  if (rawStatus === 'CONFIRMED') {
    return {
      isPast: false,
      badgeText: isGreek ? 'ΕΠΙΒΕΒΑΙΩΜΕΝΟ' : 'CONFIRMED',
      badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
      icon: <CheckCircle2 size={12} />,
    };
  }
  if (rawStatus === 'PENDING_PAYMENT') {
    return {
      isPast: false,
      badgeText: isGreek ? 'ΕΚΚΡΕΜΕΙ ΠΛΗΡΩΜΗ' : 'PAYMENT PENDING',
      badgeClass: 'bg-amber-400/20 text-amber-800 border-amber-400/40',
      icon: <Clock size={12} />,
    };
  }
  return {
    isPast,
    badgeText: isGreek ? (rawStatus === 'PENDING' ? 'ΣΕ ΑΝΑΜΟΝΗ' : rawStatus) : rawStatus,
    badgeClass: 'bg-gray-100/80 text-gray-600 border-gray-200',
    icon: null,
  };
};

export const Appointments: React.FC = () => {
  const [isGreek, setIsGreek] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    window.addEventListener('languagechange', handleLang);
    return () => {
      window.removeEventListener('storage', handleLang);
      window.removeEventListener('languagechange', handleLang);
    };
  }, []);

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
    <div className={`${sectionStyles} w-full relative overflow-x-hidden`}>
      {/* Background Hero Banner - 100% Crisp, unblurred aesthetic clinic visual */}
      <div className="absolute top-0 inset-x-0 h-[640px] sm:h-[740px] lg:h-[820px] z-0 pointer-events-none overflow-hidden">
        <img 
          src={HeroBg} 
          style={{ objectPosition: 'center 40%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover" 
          alt="Clinic Reception & Hall" 
        />
        {/* Soft Ambient Left Gradient behind typography so text is 100% readable while the reception & neon lights remain totally crisp & visible */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/95 via-white/45 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1300px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-24">
        {/* Page Title & Floating Glass Breadcrumbs */}
        <div className="max-w-xl mb-8 sm:mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 sm:mb-6"
          >
            <Link to="/my-account" className="text-gray-900 border-b border-gray-900/30 hover:border-black pb-0.5">
              {isGreek ? "ΠΙΝΑΚΑΣ ΕΛΕΓΧΟΥ" : "DASHBOARD"}
            </Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">
              {isGreek ? "ΤΑ ΡΑΝΤΕΒΟΥ ΜΟΥ" : "APPOINTMENT HISTORY"}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-gray-900 drop-shadow-sm"
          >
            {isGreek ? "ΤΑ ΡΑΝΤΕΒΟΥ ΜΟΥ" : <>MY <span className="text-[#84cc16] sm:text-[#a3e635]">APPOINTMENTS</span></>}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-5 font-bold text-xs sm:text-base max-w-xl leading-relaxed"
          >
            {isGreek ? "Δείτε τα προγραμματισμένα ραντεβού σας, παρακολουθήστε το ιστορικό σας και προγραμματίστε την επόμενη επίσκεψή σας." : "Manage your active reservations, track your aesthetic journey, and secure your next time slot."}
          </motion.p>
        </div>

        {/* Filters Grid */}
        <div className="flex items-center gap-3 mb-8 sm:mb-12 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setActiveFilter('all')} className={filterTab(activeFilter === 'all')}>
            {isGreek ? "Όλα" : "All"}
          </button>
          <button onClick={() => setActiveFilter('confirmed')} className={filterTab(activeFilter === 'confirmed')}>
            {isGreek ? "Προγραμματισμένα" : "Scheduled"}
          </button>
          <button onClick={() => setActiveFilter('completed')} className={filterTab(activeFilter === 'completed')}>
            {isGreek ? "Ολοκληρωμένα" : "Completed"}
          </button>
        </div>

        {filteredAppointments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/65 hover:bg-white/75 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] p-8 sm:p-20 text-center border border-white/85 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] transition-all duration-300"
          >
            <div className="size-16 sm:size-24 bg-white/70 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-white/90 shadow-sm">
              <CalendarDays className="text-gray-400" size={34} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase text-gray-900 mb-2 tracking-tight">
              {isGreek ? "Δεν βρέθηκαν ραντεβού" : "No records found"}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-widest mb-8">
              {isGreek ? "Δεν υπάρχουν προγραμματισμένα ραντεβού." : "Your aesthetic calendar is currently clear."}
            </p>
            <Link to="/search">
              <button className="px-8 sm:px-12 h-12 sm:h-14 bg-black text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 shadow-xl min-h-[44px] active:scale-[0.98]">
                {isGreek ? "Κλείστε νέο ραντεβού" : "Book New Reservation"}
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt: Appointment) => {
                const meta = getAppointmentMeta(apt, isGreek);
                return (
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
                        <div className="size-10 sm:size-12 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center shrink-0 shadow-sm">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-[14px] font-black uppercase tracking-tight text-gray-900 leading-none mb-1 truncate">
                            {apt.clinic?.name || "B&D Elite Clinic"}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">Premium Partner</p>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5 ${meta.badgeClass}`}>
                        {meta.icon}
                        <span>{meta.badgeText}</span>
                      </div>
                    </div>

                    {/* Treatment Detail */}
                    <div className="mb-6 sm:mb-8 min-h-[60px] sm:min-h-[80px]">
                      <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        {isGreek ? "ΘΕΡΑΠΕΙΑ ΕΝΔΙΑΦΕΡΟΝΤΟΣ" : "TREATMENT OF INTEREST"}
                      </p>
                      <h3 className="text-lg sm:text-2xl font-black uppercase text-gray-900 tracking-tight leading-tight line-clamp-2">
                        {(apt as any).serviceName || apt.service?.treatment?.name || "Aesthetic Protocol"}
                      </h3>
                    </div>

                    {/* Discreet Medical Assessment Note - only shown for upcoming active treatments */}
                    {apt.status.toLowerCase() !== 'completed' && !meta.isPast && (
                      <div className="mb-5 p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/80 flex items-start gap-2.5">
                        <Shield size={13} className="text-[#84cc16] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                          Proceeding with the treatment requires a medical assessment and informed consent.
                        </p>
                      </div>
                    )}

                    {/* Date & Time Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8 bg-white/60 backdrop-blur-sm p-3.5 sm:p-5 rounded-2xl border border-white/80">
                      <div className="flex flex-col gap-1 sm:gap-2">
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                          {isGreek ? "Ημερομηνία" : "Date"}
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-900 font-black text-[10px] sm:text-[11px] uppercase truncate">
                          <CalendarDays size={14} className="text-[#84cc16] shrink-0" />
                          <span className="truncate">{formatClinicDate(apt.startTime, apt.clinic?.timezone)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 sm:gap-2">
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                          {isGreek ? "Ώρα" : "Session Time"}
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-900 font-black text-[10px] sm:text-[11px] uppercase truncate">
                          <Clock size={14} className="text-[#84cc16] shrink-0" />
                          <span className="truncate">{formatClinicTime(apt.startTime, apt.clinic?.timezone)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Center */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200/50">
                      <div className="flex gap-2.5 sm:gap-3">
                        {(apt.status.toLowerCase() === 'completed' || (meta.isPast && apt.status.toLowerCase() === 'confirmed')) && (
                          <button 
                            onClick={() => navigate('/reviews')} 
                            className="size-10 sm:size-11 rounded-xl bg-amber-400/15 text-amber-600 border border-amber-400/25 flex items-center justify-center hover:bg-amber-400 hover:text-black transition-all min-h-[44px] min-w-[44px]" 
                            title="Rate Clinical Experience"
                          >
                            <Star size={18} />
                          </button>
                        )}
                        {apt.status.toLowerCase() !== 'cancelled' && apt.status.toLowerCase() !== 'completed' && !meta.isPast && (
                          <>
                            <button 
                              onClick={() => handleRescheduleClick(apt)} 
                              className="size-10 sm:size-11 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all shadow-md min-h-[44px] min-w-[44px]" 
                              title="Adjust Reservation"
                            >
                              <Edit3 size={17} />
                            </button>
                            <button 
                              onClick={() => handleCancelClick(apt)} 
                              className="size-10 sm:size-11 rounded-xl bg-white/70 backdrop-blur-sm text-gray-400 border border-white/80 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all min-h-[44px] min-w-[44px]" 
                              title="Recall Reservation"
                            >
                              <X size={17} />
                            </button>
                          </>
                        )}
                        {apt.status === 'PENDING_PAYMENT' as any && !meta.isPast && (
                          <button 
                            onClick={() => handleRetryPayment(apt)} 
                            className="h-10 sm:h-11 px-4 sm:px-6 rounded-xl bg-orange-500/15 text-orange-700 border border-orange-500/25 flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest min-h-[44px]" 
                            title="Pay Now"
                          >
                            <CreditCard size={14} /> PAY PROVIDER
                          </button>
                        )}
                      </div>
                      
                      {apt.rescheduleReason && (
                        <div className="group relative">
                          <MessageSquare className="text-gray-400 hover:text-black transition-colors cursor-help" size={20} />
                          <div className="absolute bottom-full right-0 mb-3 w-48 sm:w-56 p-3 sm:p-4 bg-black text-white text-[10px] font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none z-30 shadow-2xl border border-white/10 leading-relaxed">
                            <span className="block text-[#CBFF38] font-black mb-1">RESCHEDULE_REASON:</span>
                            {apt.rescheduleReason}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
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
            className="size-14 sm:size-18 bg-[#CBFF38] text-black rounded-full shadow-[0_16px_36px_rgba(203,255,56,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all group min-h-[44px] min-w-[44px] border border-[#B6EF2B]"
            aria-label="Book new appointment"
          >
            <Plus size={26} className="group-hover:rotate-90 transition-transform duration-500 sm:size-[28px]" />
          </button>
        </motion.div>
      </div>

      {reschedulingAppointment && (
        <RescheduleModal
          isOpen={!!reschedulingAppointment}
          onClose={() => setReschedulingAppointment(null)}
          appointment={reschedulingAppointment}
        />
      )}

      {/* Footer Branding */}
      <footer className="container mx-auto px-4 sm:px-8 py-8 sm:py-16 mt-8 sm:mt-16 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-6 sm:gap-10">
          <Link to="/support" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">
            {isGreek ? "Υποστήριξη ασθενών" : "Patient Support"}
          </Link>
          <Link to="/legal" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">
            {isGreek ? "Πολιτική απορρήτου" : "Privacy Policy"}
          </Link>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">© 2026 BeautyDoctors</p>
      </footer>
    </div>
  );
};
