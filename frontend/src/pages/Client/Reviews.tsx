import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUserAppointments, submitReview } from "@/store/slices/clientSlice";
import { AppointmentStatus } from "@/types";
import { ReviewForm } from "@/components/molecules/ReviewForm";
import { format } from "date-fns";
import { Star, Clock, MapPin, ArrowLeft, ChevronRight, MessageSquare, CheckCircle, Sparkles } from "lucide-react";
import { css } from "@emotion/css";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Use the user-provided reviews hero image
import HeroBg from "@/assets/Reviews_Hero.jpg";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const heroSection = css`
  position: relative;
  height: 520px;
  width: 100%;
  display: flex;
  align-items: flex-start;
  padding-top: 80px;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 90%);
    z-index: 1;
  }
`;

const glassCard = css`
  background: white;
  border-radius: 40px;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.04);
  border: 1px solid #F1F5F9;
  width: 100%;
  max-width: 1100px;
  margin: -170px auto 60px;
  position: relative;
  z-index: 10;
  overflow: hidden;
`;

const reviewCard = css`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 28px;
  padding: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #CBFF38;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.03);
    transform: translateY(-4px);
  }
`;

export const Reviews: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { appointments, isLoading } = useSelector((state: RootState) => state.client);
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchUserAppointments());
    }, [dispatch]);

    const completedAppointments = appointments.filter(
        (apt) => apt.status === AppointmentStatus.COMPLETED
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
            {/* Immersive Hero */}
            <div className={heroSection}>
                <div className="absolute inset-0 z-0">
                    <img
                        src={HeroBg}
                        style={{ objectPosition: 'center 80%' }}
                        className="w-full h-full object-cover"
                        alt="Review Hero"
                    />
                </div>

                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic">
                            <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
                            <ChevronRight size={12} className="text-lime-500" />
                            <span className="text-lime-500">RATINGS & FEEDBACK</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
                            YOUR EXCELLENCE <span className="text-[#CBFF38]">FEEDBACK</span>
                        </h1>

                        <p className="text-gray-500 mt-6 font-bold text-lg max-w-lg leading-relaxed italic">
                            Share your treatment journey with our community. Your reviews help us maintain the highest standards of care.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 relative z-20">
                {/* Success Banner */}
                <AnimatePresence>
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-8 bg-black text-[#CBFF38] px-8 py-6 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden"
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <CheckCircle size={24} />
                                <span className="font-black text-xs uppercase tracking-[0.2em] italic">{successMessage}</span>
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
                                <div className="w-full lg:w-[400px] bg-gray-50 p-12 lg:p-16 border-r border-gray-100">
                                    <button
                                        onClick={() => setSelectedAppointment(null)}
                                        className="mb-12 flex items-center gap-2 text-gray-400 hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <ArrowLeft size={14} /> Back to List
                                    </button>

                                    <div className="size-20 rounded-[28px] bg-black flex items-center justify-center text-[#CBFF38] mb-8 shadow-xl shadow-black/10">
                                        <Star size={32} />
                                    </div>

                                    <h2 className="text-3xl font-black uppercase italic text-gray-900 leading-tight mb-4">Rate Your Visit</h2>
                                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed italic">
                                        Professionalism, result, and atmosphere are key metrics we monitor.
                                    </p>

                                    <div className="mt-12 py-8 border-t border-gray-200">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Treatment Detail</p>
                                        <h4 className="text-xl font-black text-gray-900 uppercase italic mb-2">{selectedAppointment.service?.name}</h4>
                                        <p className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-2"><MapPin size={12} /> {selectedAppointment.clinic?.name}</p>
                                        <p className="text-xs font-bold text-gray-600 flex items-center gap-2"><Clock size={12} /> {format(new Date(selectedAppointment.startTime), "MMMM d, yyyy")}</p>
                                    </div>
                                </div>

                                <div className="flex-1 p-12 lg:p-20 bg-white">
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
                            className="relative -mt-[170px] z-20"
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center py-32 gap-6">
                                    <div className="size-12 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em] italic">Accessing review portal...</p>
                                </div>
                            ) : completedAppointments.length === 0 ? (
                                <div className={`${glassCard} text-center py-32 px-12`}>
                                    <div className="size-20 bg-gray-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-gray-200">
                                        <MessageSquare size={40} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase italic text-gray-900 mb-4 tracking-tighter">No Consultations to Review</h3>
                                    <p className="text-gray-400 max-w-sm mx-auto text-base font-bold italic leading-relaxed">
                                        Your feedback loop opens automatically after every successful treatment at our clinics.
                                    </p>
                                    <Link to="/search" className="inline-flex items-center gap-3 mt-12 bg-black text-[#CBFF38] px-12 h-16 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] hover:bg-gray-900 transition-all shadow-2xl">
                                        Schedule Visit <Sparkles size={18} />
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-20">
                                    {completedAppointments.map((apt, i) => (
                                        <motion.div
                                            key={apt.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={reviewCard}
                                        >
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 group-hover:bg-[#CBFF38] transition-colors">
                                                    <Sparkles size={24} />
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] mb-1">Status Verified</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {format(new Date(apt.startTime), "MMM dd, yyyy")}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="font-black text-2xl uppercase italic text-gray-900 mb-3 leading-tight tracking-tight">
                                                {apt.service?.name || "Premium Treatment"}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">
                                                <MapPin size={12} className="text-[#CBFF38]" />
                                                {apt.clinic?.name || "Wellness Clinic"}
                                            </div>

                                            <div className="flex gap-1 mb-8">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={18} className="text-gray-100 fill-gray-100" />
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => handleSelectAppointment(apt)}
                                                className="w-full flex items-center justify-center gap-3 bg-black text-[#CBFF38] h-14 rounded-[18px] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gray-900 transition-all shadow-xl active:scale-[0.98]"
                                            >
                                                Submit Review <ChevronRight size={16} />
                                            </button>
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
