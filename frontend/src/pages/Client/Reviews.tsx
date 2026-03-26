import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUserAppointments, submitReview } from "@/store/slices/clientSlice";
import { ReviewForm } from "@/components/molecules/ReviewForm";
import { format } from "date-fns";
import { Star, Clock, MapPin, ArrowLeft } from "lucide-react";
import { css } from "@emotion/css";
import { Link } from "react-router-dom";
import { FaChevronRight, FaCircleCheck } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";

const sectionStyles = css`
  min-height: 100vh;
  background: #FDFDFD;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const premiumCard = css`
  background: white;
  border: 1px solid rgba(241, 245, 249, 1);
  border-radius: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
`;

export const Reviews: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading } = useSelector((state: RootState) => state.client);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    dispatch(fetchUserAppointments());
  }, [dispatch]);

  const completedAppointments = appointments.filter(
    (apt) => apt.status === "completed"
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
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleSelectAppointment = (apt: any) => {
    setSelectedAppointment(apt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
            <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
            <FaChevronRight size={10} />
            <span>My Reviews</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">
            Ratings & Feedback
          </h1>
          <p className="text-gray-400 mt-2 font-medium max-w-lg">
            Share your experience after each visit. Reviews are reviewed by our team before going live.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">

        {/* Success Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-black text-[#CBFF38] px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg"
            >
              <FaCircleCheck size={20} />
              <span className="font-black text-[11px] uppercase tracking-widest italic">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedAppointment ? (
            <motion.div
              key="review-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={premiumCard}
            >
              {/* Form Header */}
              <div className="bg-[#1A1A1A] p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase italic text-white">Share Your Experience</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Your feedback helps the community</p>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  <ArrowLeft size={14} /> Cancel
                </button>
              </div>

              {/* Appointment Summary */}
              <div className="px-8 pt-8">
                <div className="bg-[#CBFF38]/10 border border-[#CBFF38]/20 rounded-2xl p-6 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Reviewing visit to</p>
                  <h3 className="text-xl font-black uppercase italic text-gray-900 mb-3">
                    {selectedAppointment.service?.name || "Treatment"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 font-bold">
                      <MapPin size={14} className="text-black" />
                      {selectedAppointment.clinic?.name}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock size={14} className="text-black" />
                      {format(new Date(selectedAppointment.startTime), "MMMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <ReviewForm onSubmit={handleSubmitReview} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="appointment-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center py-24 gap-4">
                  <div className="size-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest italic">Loading your visits...</p>
                </div>
              ) : completedAppointments.length === 0 ? (
                <div className={`${premiumCard} text-center py-24 px-8`}>
                  <Clock className="mx-auto h-16 w-16 text-gray-100 mb-6" />
                  <h3 className="text-2xl font-black uppercase italic text-gray-900 mb-2">No Completed Visits Yet</h3>
                  <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium">
                    Once you complete an appointment, you can leave a star rating and written review.
                  </p>
                  <Link to="/search" className="inline-flex items-center gap-2 mt-8 bg-black text-[#CBFF38] px-6 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-900 transition-all">
                    Book a Treatment
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {completedAppointments.map((apt, i) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`${premiumCard} p-6 flex flex-col justify-between hover:shadow-md transition-all`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-black text-[#CBFF38] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Completed
                          </span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {format(new Date(apt.startTime), "MMM d, yyyy")}
                          </span>
                        </div>
                        <h3 className="font-black text-xl uppercase italic text-gray-900 mb-2 leading-tight">
                          {apt.service?.name || "Treatment"}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-400 font-bold">
                          <MapPin size={13} />
                          {apt.clinic?.name || "Clinic"}
                        </div>
                        {/* Star preview */}
                        <div className="flex gap-1 mt-4">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={16} className="text-gray-100 fill-gray-100" />
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <button
                          onClick={() => handleSelectAppointment(apt)}
                          className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all"
                        >
                          <Star size={14} className="text-[#CBFF38] fill-[#CBFF38]" />
                          Rate & Review
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
