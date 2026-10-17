import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import { motion } from "framer-motion";
import {
  Calendar,
  User,
  Receipt,
  Gift,
  Star,
  BookOpen,
  Mail,
  ChevronRight,
  ArrowRight,
  Sparkles
} from "lucide-react";

import AccountHero from "@/assets/my_account_bg.png";

export const MyAccount: React.FC = () => {
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
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { appointments } = useSelector((state: RootState) => state.client);

  useEffect(() => {
    if (isAuthenticated && !appointments.length) {
      dispatch(fetchUserAppointments());
    }
  }, [dispatch, isAuthenticated, appointments.length]);

  if (!isAuthenticated) return null;

  const menuItems = [
    {
      title: isGreek ? "ΡΑΝΤΕΒΟΥ" : "APPOINTMENTS",
      desc: isGreek ? "ΙΣΤΟΡΙΚΟ & ΕΠΙΣΚΕΨΕΙΣ" : "TIMELINE & VISITS",
      icon: <Calendar className="size-5" />,
      link: "/appointments"
    },
    {
      title: isGreek ? "ΠΡΟΣΩΠΙΚΑ ΣΤΟΙΧΕΙΑ" : "PERSONAL DETAILS",
      desc: isGreek ? "ΣΤΟΙΧΕΙΑ ΛΟΓΑΡΙΑΣΜΟΥ" : "ACCOUNT INFORMATION",
      icon: <User className="size-5" />,
      link: "/personal-details"
    },
    {
      title: isGreek ? "ΠΛΗΡΩΜΕΣ & ΧΡΕΩΣΕΙΣ" : "PAYMENTS & INVOICES",
      desc: isGreek ? "ΙΣΤΟΡΙΚΟ ΠΛΗΡΩΜΩΝ" : "PAYMENT HISTORY",
      icon: <Receipt className="size-5" />,
      link: "/payments"
    },
    {
      title: isGreek ? "ΔΩΡΟΚΑΡΤΕΣ" : "GIFT CARDS",
      desc: isGreek ? "ΜΟΙΡΑΣΤΕΙΤΕ ΠΟΛΥΤΕΛΕΙΑ" : "SHARE LUXURY",
      icon: <Gift className="size-5" />,
      link: "/gift-card"
    },
    {
      title: isGreek ? "ΑΞΙΟΛΟΓΗΣΕΙΣ" : "FEEDBACK",
      desc: isGreek ? "Η ΕΜΠΕΙΡΙΑ ΣΑΣ" : "YOUR APPOINTMENT EXPERIENCE",
      icon: <Star className="size-5" />,
      link: "/reviews"
    },
    {
      title: isGreek ? "ΑΙΣΘΗΤΙΚΗ ΕΝΗΜΕΡΩΣΗ" : "AESTHETIC INTELLIGENCE",
      desc: isGreek ? "ΑΡΘΡΑ & ΣΥΜΒΟΥΛΕΣ" : "ARTICLES & INSIGHTS",
      icon: <BookOpen className="size-5" />,
      link: "/blog"
    },
    {
      title: isGreek ? "ΜΗΝΥΜΑΤΑ" : "MESSAGES",
      desc: isGreek ? "ΟΙ ΣΥΝΟΜΙΛΙΕΣ ΣΑΣ" : "YOUR CONVERSATIONS",
      icon: <Mail className="size-5" />,
      link: "/messages"
    }
  ];

  const userInitial = user?.firstName?.[0] || user?.email?.[0] || 'U';

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-hidden flex flex-col justify-between">
      {/* Background Hero Image - 100% Crisp & Sharp, zero blur */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={AccountHero}
          className="w-full h-full object-cover object-[right_top]"
          style={{ filter: 'none', imageRendering: 'auto' }}
          alt="Member Lounge Background"
        />
        {/* Soft Ambient Left Gradient behind typography so greetings are 100% readable while the lounge and model remain totally uncovered */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/90 via-white/40 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into cards */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-10 md:pt-12 pb-16">
        {/* Top Header Section (Floating Glass Greeting) */}
        <div className="max-w-xl mb-20 sm:mb-28 md:mb-36">
          {/* Member Lounge Floating Glass Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4"
          >
            <span className="text-gray-950 border-b border-gray-900/30 pb-0.5">
              BEAUTY DOCTORS
            </span>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">
              MEMBER LOUNGE
            </span>
          </motion.div>

          {/* Greeting Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-4 sm:gap-5 p-3.5 sm:p-5 rounded-3xl bg-white/65 hover:bg-white/80 backdrop-blur-xl border border-white/85 shadow-lg shadow-black/5 transition-all"
          >
            <div className="size-14 sm:size-18 md:size-20 rounded-2xl sm:rounded-[24px] bg-black text-[#CBFF38] flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-black shadow-xl shrink-0 border border-[#CBFF38]/20">
              {userInitial.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 leading-none">
                {isGreek ? "HELLO," : "HELLO,"}{" "}
                <span className="text-[#84cc16] sm:text-[#a3e635]">{user?.firstName || (isGreek ? "ΜΕΛΟΣ" : "MEMBER")}</span>
              </h1>
              <p className="text-gray-500 mt-2 font-bold text-xs sm:text-[13px] uppercase tracking-[0.16em] flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#CBFF38] shrink-0 shadow-xs" />
                <span>{user?.email}</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* 8-Card Grid (4 Columns x 2 Rows) - Transparent Frosted Glass */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {menuItems.map((item, idx) => (
            <Link to={item.link} key={idx} className="block group">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white/65 hover:bg-white/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/85 shadow-[0_15px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(203,255,56,0.15)] hover:border-[#CBFF38]/70 transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] h-full"
              >
                {/* Top: Icon in soft dark/lime badge */}
                <div>
                  <div className="size-11 sm:size-12 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center shadow-md shadow-black/10 group-hover:scale-105 group-hover:bg-[#CBFF38] group-hover:text-black transition-all">
                    {item.icon}
                  </div>
                </div>

                {/* Bottom: Title & Subtitle on left, Chevron circle button on right */}
                <div className="flex items-end justify-between gap-2 pt-4">
                  <div className="min-w-0 pr-1">
                    <h3 className="text-sm sm:text-[15px] font-black uppercase text-gray-900 tracking-tight leading-snug group-hover:text-black">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                  <div className="size-8 sm:size-9 rounded-full bg-white/80 backdrop-blur-sm border border-white/90 shadow-2xs flex items-center justify-center text-gray-600 group-hover:bg-[#CBFF38] group-hover:text-black group-hover:border-[#CBFF38] transition-all shrink-0 mb-0.5">
                    <ChevronRight size={15} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}

          {/* 8th Card: Ready for your next appointment */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-black/90 backdrop-blur-xl text-white rounded-3xl p-5 sm:p-6 border border-white/15 shadow-xl flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group hover:border-[#CBFF38]/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[#CBFF38]">
                  <Sparkles size={22} className="stroke-[2.2]" />
                </div>
                <div 
                  onClick={() => navigate('/treatments')}
                  className="size-8 sm:size-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-[#CBFF38] group-hover:text-black transition-all cursor-pointer"
                >
                  <ChevronRight size={15} />
                </div>
              </div>

              <h3 className="text-xs sm:text-[13px] font-black uppercase text-white tracking-tight leading-snug mb-1">
                {isGreek ? "ΕΙΣΤΕ ΕΤΟΙΜΟΙ ΓΙΑ ΤΟ ΕΠΟΜΕΝΟ ΡΑΝΤΕΒΟΥ;" : "READY FOR YOUR NEXT APPOINTMENT?"}
              </h3>
              <p className="text-[10px] text-gray-300 font-medium leading-relaxed line-clamp-2">
                {isGreek ? "Κλείστε ραντεβού με ιατρό ή κλινική." : "Explore treatments & book with a partner clinic."}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate('/treatments')}
                className="w-full bg-[#CBFF38] hover:bg-white text-black font-black text-[10px] sm:text-[11px] uppercase tracking-wider py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>{isGreek ? "ΚΛΕΙΣΤΕ ΡΑΝΤΕΒΟΥ" : "BOOK APPOINTMENT"}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
