import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUserAppointments, submitReview } from "@/store/slices/clientSlice";
import { AppointmentStatus } from "@/types";
import { ReviewForm } from "@/components/molecules/ReviewForm";
import { Star, Clock, MapPin, ArrowLeft, ChevronRight, ChevronLeft, MessageSquare, CheckCircle, Sparkles } from "lucide-react";
import { css } from "@emotion/css";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Use the crisp, unblurred reviews hero image
import HeroBg from "@/assets/Reviews_Hero.png";
import { formatDate } from "@/utils/formatters";

const glassCard = css`
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
  border-radius: 28px;
  @media (min-width: 640px) {
    border-radius: 36px;
  }
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 40px;
  position: relative;
  z-index: 10;
  overflow: hidden;
`;

const reviewCard = css`
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.78);
    border-color: rgba(203, 255, 56, 0.7);
    box-shadow: 0 30px 60px -10px rgba(203, 255, 56, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95);
    transform: translateY(-4px);
  }
`;

export const Reviews: React.FC = () => {
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
  const { appointments, isLoading } = useSelector((state: RootState) => state.client);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  const completedAppointments = appointments.filter(
    (apt) => apt.status === AppointmentStatus.COMPLETED
  );

  const totalPages = Math.ceil(completedAppointments.length / itemsPerPage);
  const paginatedAppointments = completedAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!selectedAppointment) return;
    try {
      await dispatch(submitReview({
        clinicId: selectedAppointment.clinicId,
        data: { rating, comment, appointmentId: selectedAppointment.id }
      })).unwrap();
      setSuccessMessage("Thank you! Your review is pending approval.");
      setSelectedAppointment(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || "Failed to submit review. Please try again.");
      alert(errorMessage);
      if (errorMessage.toLowerCase().includes("already reviewed")) {
        setSelectedAppointment(null);
      }
    }
  };

  const handleSelectAppointment = (apt: any) => {
    setSelectedAppointment(apt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden">
      {/* Background Hero Banner - 100% Crisp, unblurred doctor & patient visual */}
      <div className="absolute top-0 inset-x-0 h-[640px] sm:h-[740px] lg:h-[820px] z-0 pointer-events-none overflow-hidden">
        <img
          src={HeroBg}
          style={{ objectPosition: '85% 15%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover"
          alt="Review Hero"
        />
        {/* Soft Ambient Left Gradient strictly behind typography so text is 100% readable while the doctor & patient remain totally crisp & visible */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/95 via-white/45 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1300px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-24">
        {/* Page Title & Floating Glass Breadcrumbs */}
        <div className="max-w-xl mb-10 sm:mb-14">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 sm:mb-6"
          >
            <Link to="/my-account" className="text-gray-900 border-b border-gray-900/30 hover:border-black pb-0.5">ACCOUNT</Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">{isGreek ? "ΑΞΙΟΛΟΓΗΣΕΙΣ" : "RATINGS & FEEDBACK"}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-gray-900 drop-shadow-sm"
          >
            {isGreek ? "Η ΑΞΙΟΛΟΓΗΣΗ ΣΑΣ ΜΕΤΡΑΕΙ" : <>YOUR FEEDBACK <span className="text-[#84cc16] sm:text-[#a3e635]">MATTERS</span></>}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-5 font-bold text-xs sm:text-base max-w-lg leading-relaxed"
          >
            {isGreek ? "Μοιραστείτε την εμπειρία σας από το ραντεβού σας και βοηθήστε μας να βελτιώσουμε τις υπηρεσίες μας." : "Share your feedback about your appointment and experience with Beauty Doctors."}
          </motion.p>
        </div>

        {/* Success Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 bg-black text-[#CBFF38] px-6 sm:px-8 py-5 rounded-[2rem] sm:rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <CheckCircle size={24} />
                <span className="font-black text-xs uppercase tracking-[0.2em]">{successMessage}</span>
              </div>
              <div className="absolute right-0 top-0 opacity-10 p-4">
                <Sparkles size={60} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedAppointment ? (
            <motion.div
              key="review-form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={glassCard}
            >
              <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:w-[400px] bg-white/70 backdrop-blur-md p-6 sm:p-12 lg:p-16 border-r border-white/80">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="mb-12 flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest"
                  >
                    <ArrowLeft size={14} /> Back to List
                  </button>

                  <div className="size-20 rounded-[28px] bg-black flex items-center justify-center text-[#CBFF38] mb-8 shadow-xl shadow-black/10">
                    <Star size={32} />
                  </div>

                  <h2 className="text-3xl font-black uppercase text-gray-900 leading-tight mb-4">Rate Your Visit</h2>
                  <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                    Professionalism, result, and atmosphere are key metrics we monitor.
                  </p>

                  <div className="mt-12 py-8 border-t border-gray-200/70">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Treatment Detail</p>
                    <h4 className="text-xl font-black text-gray-900 uppercase mb-2">{selectedAppointment.service?.name}</h4>
                    <p className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-2"><MapPin size={12} className="text-[#84cc16]" /> {selectedAppointment.clinic?.name}</p>
                    <p className="text-xs font-bold text-gray-600 flex items-center gap-2"><Clock size={12} className="text-[#84cc16]" /> {formatDate(selectedAppointment.startTime)}</p>
                  </div>
                </div>

                <div className="flex-1 p-6 sm:p-12 lg:p-20 bg-white/60 backdrop-blur-md">
                  <ReviewForm onSubmit={handleSubmitReview} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="appointment-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative z-20"
            >
              {isLoading ? (
                <div className="flex flex-col items-center py-32 gap-6">
                  <div className="size-12 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em]">Accessing review portal...</p>
                </div>
              ) : completedAppointments.length === 0 ? (
                <div className={`${glassCard} text-center py-20 sm:py-32 px-6 sm:px-12`}>
                  <div className="size-20 bg-white/70 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-gray-400 border border-white/80 shadow-sm">
                    <MessageSquare size={38} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-gray-900 mb-4 tracking-tight">
                    {isGreek ? "ΔΕΝ ΥΠΑΡΧΟΥΝ ΟΛΟΚΛΗΡΩΜΕΝΑ ΡΑΝΤΕΒΟΥ ΠΡΟΣ ΑΞΙΟΛΟΓΗΣΗ" : "NO COMPLETED APPOINTMENTS TO REVIEW"}
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto text-sm sm:text-base font-bold leading-relaxed">
                    {isGreek ? "Μπορείτε να υποβάλετε αξιολόγηση μετά την ολοκλήρωση ενός ραντεβού." : "You can leave feedback after a completed appointment."}
                  </p>
                  <Link to="/search" className="inline-flex items-center gap-3 mt-10 bg-black text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black px-8 sm:px-12 h-14 sm:h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 shadow-2xl active:scale-[0.98]">
                    {isGreek ? "Κλείστε ραντεβού" : "Schedule Visit"} <Sparkles size={18} />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
                    {paginatedAppointments.map((apt, i) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={reviewCard}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="size-13 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center shadow-md shadow-black/10 group-hover:scale-105 transition-transform">
                            <Sparkles size={22} />
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-500/15 border border-emerald-500/30 mb-1.5">
                              <CheckCircle size={10} className="text-emerald-600" />
                              {isGreek ? "ΕΠΙΒΕΒΑΙΩΜΕΝΟ" : "STATUS VERIFIED"}
                            </span>
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              {formatDate(apt.startTime)}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-black text-xl sm:text-2xl uppercase text-gray-900 mb-2 leading-tight tracking-tight">
                          {apt.service?.name || "Premium Treatment"}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">
                          <MapPin size={13} className="text-[#84cc16]" />
                          {apt.clinic?.name || "Wellness Clinic"}
                        </div>

                        <div className="flex items-center gap-1.5 mb-8 p-2.5 rounded-xl bg-white/60 border border-white/80 backdrop-blur-sm w-fit">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={16} className="text-amber-400 fill-amber-400" />
                          ))}
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">5.0</span>
                        </div>

                        <button
                          onClick={() => handleSelectAppointment(apt)}
                          className="w-full flex items-center justify-center gap-3 bg-black text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black h-12 sm:h-14 rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] transition-all duration-300 shadow-xl shadow-black/10 active:scale-[0.98]"
                        >
                          {isGreek ? "Υποβολή αξιολόγησης" : "Submit Review"} <ChevronRight size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mb-20 px-6 py-5 bg-white/65 hover:bg-white/75 backdrop-blur-xl rounded-3xl border border-white/85 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300">
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                        {isGreek ? `Εμφάνιση ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, completedAppointments.length)} από ${completedAppointments.length}` : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, completedAppointments.length)} of ${completedAppointments.length} appointments`}
                      </p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 250, behavior: 'smooth' }); }} disabled={currentPage === 1} className="size-9 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-black hover:text-[#CBFF38] hover:border-black disabled:opacity-30 disabled:hover:bg-white/70 disabled:hover:text-gray-700 disabled:hover:border-white/80 disabled:cursor-not-allowed transition-all shadow-sm" title="Previous page">
                          <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => {
                            if (totalPages > 6 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                              if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-1 text-gray-400 text-xs font-black">...</span>;
                              return null;
                            }
                            const isActive = pageNum === currentPage;
                            return (
                              <button key={pageNum} type="button" onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 250, behavior: 'smooth' }); }} className={`size-9 rounded-xl text-xs font-black transition-all ${isActive ? 'bg-black text-[#CBFF38] shadow-md shadow-black/10' : 'bg-white/70 backdrop-blur-sm border border-white/80 text-gray-700 hover:border-black hover:text-black'}`}>
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button type="button" onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 250, behavior: 'smooth' }); }} disabled={currentPage === totalPages} className="size-9 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-black hover:text-[#CBFF38] hover:border-black disabled:opacity-30 disabled:hover:bg-white/70 disabled:hover:text-gray-700 disabled:hover:border-white/80 disabled:cursor-not-allowed transition-all shadow-sm" title="Next page">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
