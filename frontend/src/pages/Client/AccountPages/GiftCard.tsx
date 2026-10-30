import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import {
  Gift,
  Copy,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  CreditCard,
  Clock,
  Bell,
  Heart,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Luxury white gift box with green satin ribbon hero image
import HeroBg from "@/assets/giftcard_bg.png";

const sectionStyles = css`
  min-height: 100vh;
  background: #F8FAFC;
`;

const glassCard = css`
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 50px;
  position: relative;
  z-index: 20;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  @media (min-width: 640px) {
    border-radius: 36px;
  }

  &:hover {
    border-color: rgba(203, 255, 56, 0.6);
    box-shadow: 0 35px 70px -15px rgba(203, 255, 56, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

const voucherStyle = css`
  background: #1A1A1A;
  color: white;
  border-radius: 32px;
  padding: 24px;
  @media (min-width: 640px) {
    padding: 48px;
  }
  position: relative;
  overflow: hidden;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40px;
    height: 40px;
    background: #F8FAFC;
    border-radius: 50%;
    transform: translateY(-50%);
    z-index: 2;
  }
  &::before { left: -20px; }
  &::after { right: -20px; }
`;

export const GiftCard: React.FC = () => {
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

  const [giftCardCode, setGiftCardCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      const code = params.get('code');
      if (code) {
        setGiftCardCode(code);
      }
    }
  }, [location.search]);

  const copyToClipboard = () => {
    if (giftCardCode) {
      navigator.clipboard.writeText(giftCardCode);
      setCopied(true);
      toast.success(isGreek ? "Ο κωδικός αντιγράφηκε!" : "Voucher code copied!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail || !notifyEmail.includes("@")) {
      toast.error(isGreek ? "Εισάγετε έγκυρο email" : "Please enter a valid email address");
      return;
    }
    setIsSubscribed(true);
    toast.success(isGreek ? "Θα σας ειδοποιήσουμε!" : "We will notify you at launch!");
  };

  return (
    <div className={`${sectionStyles} relative overflow-x-hidden`}>
      {/* Background Hero Banner - 100% Crisp, unblurred gift box visual */}
      <div className="absolute top-0 inset-x-0 h-[640px] sm:h-[740px] lg:h-[820px] z-0 pointer-events-none overflow-hidden">
        <img
          src={HeroBg}
          style={{ objectPosition: 'center 40%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover"
          alt="Beauty Doctors Luxury Gift Card"
        />
        {/* Soft Ambient Left Gradient behind typography so text is 100% readable while the gift box remains totally crisp & visible */}
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
              ACCOUNT
            </Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">DIGITAL GIFT CARDS</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#CBFF38]/30 border border-[#CBFF38] text-[9px] font-black uppercase tracking-widest text-black ml-1">
              <span className="size-1.5 rounded-full bg-lime-600 animate-pulse" />
              LAUNCHING SOON
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-gray-900 drop-shadow-sm"
          >
            BEAUTY GIFT <span className="text-[#84cc16] sm:text-[#a3e635]">CARDS</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-5 font-bold text-xs sm:text-base max-w-lg leading-relaxed"
          >
            {isGreek
              ? "Χαρίστε την εμπειρία ομορφιάς και αυτοπεποίθησης με μια ψηφιακή δωροκάρτα BeautyDoctors."
              : "Give the gift of excellence and elevate someone's confidence with a luxury digital gift card."}
          </motion.p>

          {/* Terms Glass Box */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-lg p-4 sm:p-5 rounded-2xl bg-white/65 hover:bg-white/80 backdrop-blur-xl border border-white/85 shadow-lg shadow-black/5 transition-all"
          >
            <p className="text-xs sm:text-[13px] text-gray-800 font-semibold leading-relaxed">
              {isGreek
                ? "Οι δωροκάρτες BeautyDoctors θα χρησιμοποιούνται αποκλειστικά για επιλέξιμες μη ιατρικές υπηρεσίες αισθητικής στο δίκτυο της BeautyDoctors."
                : "BeautyDoctors Gift Cards are redeemable exclusively for eligible non-medical aesthetic services within the participating Beauty Doctors network."}
            </p>
            <div className="mt-2.5">
              <Link
                to="/gift-card-terms"
                className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-black hover:text-lime-700 underline decoration-lime-500 underline-offset-4 transition-colors"
              >
                {isGreek ? "Όροι Δωροκάρτας" : "Gift Card Terms"} <ChevronRight size={12} className="text-[#84cc16]" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {!giftCardCode ? (
            <motion.div
              key="launching-soon"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={glassCard}
            >
              {/* Header Bar */}
              <div className="px-5 sm:px-10 py-5 border-b border-gray-200/60 bg-white/40 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center shadow-xs">
                    <Gift size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">
                    BEAUTYDOCTORS · DIGITAL EXPERIENCE
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700">
                  <Clock size={14} className="text-[#84cc16]" />
                  <span>PREPARING LAUNCH</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-col lg:flex-row">
                {/* Left Side: Launching Soon Announcement */}
                <div className="flex-1 p-6 sm:p-10 lg:p-14">
                  {/* Regulatory Disclaimer Notice */}
                  <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 backdrop-blur-sm">
                    <Sparkles className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-amber-950">
                        {isGreek
                          ? "Οι δωροκάρτες BeautyDoctors θα χρησιμοποιούνται αποκλειστικά για επιλεγμένες μη ιατρικές υπηρεσίες αισθητικής με την ένδειξη “Δέχεται δωροκάρτα” σε συμμετέχοντες παρόχους."
                          : "BeautyDoctors Gift Cards are available exclusively for selected non-medical aesthetic services marked as Gift Card Eligible at participating providers."}
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {isGreek
                          ? "Δεν χρησιμοποιούνται για ιατρικές επισκέψεις ή ιατρικές πράξεις."
                          : "They cannot be used for medical consultations or medical procedures."}
                      </p>
                      <div className="mt-2">
                        <Link
                          to="/gift-card-terms"
                          className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-950 underline decoration-amber-500 underline-offset-4 hover:text-amber-800"
                        >
                          {isGreek ? "Όροι Δωροκάρτας" : "Gift Card Terms"} <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Launching Soon Hero Text */}
                  <div className="space-y-4 mb-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em]">
                      <Sparkles size={12} />
                      <span>OFFICIAL ANNOUNCEMENT</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-gray-900 tracking-tight leading-none">
                      LAUNCHING SOON
                    </h2>

                    <p className="text-base sm:text-lg font-bold text-gray-800 leading-relaxed">
                      We are currently preparing an exclusive digital gift card experience for you.
                    </p>

                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      Soon, you will be able to effortlessly purchase and send digital gift cards to friends,
                      family, or colleagues. Our digital gift vouchers will allow your loved ones to choose and
                      enjoy eligible luxury aesthetic care across participating verified providers in our network.
                    </p>
                  </div>

                  {/* Feature Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 pb-8 border-t border-gray-200/50">
                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 space-y-1.5">
                      <div className="size-8 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center shadow-2xs">
                        <Gift size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-gray-900">Custom Values</h4>
                      <p className="text-[11px] text-gray-500 leading-normal font-medium">
                        Flexible amounts tailored for any occasion or package.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 space-y-1.5">
                      <div className="size-8 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center shadow-2xs">
                        <Sparkles size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-gray-900">Instant Delivery</h4>
                      <p className="text-[11px] text-gray-500 leading-normal font-medium">
                        Send digital vouchers directly with a personalized message.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 space-y-1.5">
                      <div className="size-8 rounded-xl bg-black text-[#CBFF38] flex items-center justify-center shadow-2xs">
                        <ShieldCheck size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-gray-900">Verified Network</h4>
                      <p className="text-[11px] text-gray-500 leading-normal font-medium">
                        Redeemable with ease at participating aesthetic clinics.
                      </p>
                    </div>
                  </div>

                  {/* Notification Sign-up Form */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/80">
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-gray-900 mb-1 flex items-center gap-2">
                      <Bell size={15} className="text-[#84cc16]" />
                      Be the First to Know
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mb-4">
                      Enter your email to receive early access and an exclusive launch offer when Gift Cards go live.
                    </p>

                    {isSubscribed ? (
                      <div className="p-3.5 bg-white border border-[#CBFF38] rounded-2xl flex items-center gap-3 text-black">
                        <CheckCircle size={18} className="text-[#84cc16] shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Thank you! We will notify you at launch.
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="flex-1 px-4 h-12 bg-white/80 backdrop-blur-sm rounded-xl border border-white/90 text-xs font-semibold text-gray-900 outline-none focus:border-black transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-6 h-12 bg-black hover:bg-[#CBFF38] hover:text-black text-[#CBFF38] rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          NOTIFY ME
                        </button>
                      </form>
                    )}
                    <p className="text-[11px] text-gray-500 mt-2.5 leading-relaxed">
                      {isGreek ? (
                        <>
                          Θα λάβετε ένα email όταν ξεκινήσουν οι δωροκάρτες. Δείτε την{" "}
                          <Link to="/privacy-policy" className="underline font-bold text-gray-800 hover:text-black">
                            Πολιτική Απορρήτου
                          </Link>
                          .
                        </>
                      ) : (
                        <>
                          You will receive one email when Gift Cards launch. See our{" "}
                          <Link to="/privacy-policy" className="underline font-bold text-gray-800 hover:text-black">
                            Privacy Policy
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right Side: Luxury Card Showcase */}
                <div className="w-full lg:w-[420px] p-4 sm:p-8 flex flex-col justify-between">
                  <div className="bg-[#1A1A1A] text-white rounded-[32px] p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group border border-white/10 min-h-[420px]">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#CBFF38]/10 rounded-full blur-3xl pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className="size-14 rounded-2xl bg-[#CBFF38] flex items-center justify-center text-black shadow-lg">
                          <Gift size={28} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/10 text-[#CBFF38] text-[9px] font-black uppercase tracking-widest border border-[#CBFF38]/30">
                          COMING SOON
                        </span>
                      </div>

                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#CBFF38] mb-1">
                        BEAUTY DOCTORS
                      </p>
                      <h4 className="text-2xl sm:text-3xl font-black uppercase leading-tight tracking-[0.02em] text-white">
                        THE GIFT OF <br />EXCELLENCE
                      </h4>

                      <div className="w-full h-px bg-white/10 my-6" />

                      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                        A curated digital gifting experience designed for sophisticated aesthetic wellness.
                      </p>
                    </div>

                    <div className="mt-8 space-y-3">
                      <button
                        type="button"
                        onClick={() => navigate('/treatments')}
                        className="w-full bg-[#CBFF38] hover:bg-white text-black h-14 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                      >
                        <span>EXPLORE TREATMENTS</span>
                        <ArrowRight size={14} />
                      </button>

                      <Link
                        to="/my-account"
                        className="w-full bg-white/10 hover:bg-white/15 text-white h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all"
                      >
                        RETURN TO ACCOUNT
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto"
            >
              <div className={voucherStyle}>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles size={120} />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-6 sm:gap-0 justify-between items-start mb-10 sm:mb-16 relative z-10">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#CBFF38] mb-3">
                      {isGreek ? "ΨΗΦΙΑΚΗ ΔΩΡΟΚΑΡΤΑ BEAUTYDOCTORS" : "DIGITAL BEAUTY VOUCHER"}
                    </h3>
                    <h4 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
                      {isGreek ? "ΕΠΙΒΕΒΑΙΩΣΗ ΔΩΡΟΚΑΡΤΑΣ" : "VOUCHER CONFIRMED"}
                    </h4>
                  </div>
                  <div className="size-20 rounded-3xl bg-[#CBFF38] flex items-center justify-center text-black shadow-xl shadow-lime-500/20">
                    <CheckCircle size={40} />
                  </div>
                </div>

                <div className="border-2 border-dashed border-white/10 pt-10 pb-10 text-center bg-white/5 rounded-3xl relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-6">
                    {isGreek ? "Κωδικός Δωροκάρτας" : "Secure Voucher Code"}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-4 sm:px-10">
                    <span className="text-xl sm:text-5xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-white tabular-nums text-center break-all">
                      {giftCardCode}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className={`w-full sm:w-auto h-16 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer ${
                        copied
                          ? 'bg-[#CBFF38] text-black shadow-xl shadow-lime-500/20'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                      {copied ? (isGreek ? "ΑΝΤΙΓΡΑΦΗΚΕ" : "COPIED") : (isGreek ? "ΑΝΤΙΓΡΑΦΗ ΚΩΔΙΚΟΥ" : "COPY CODE")}
                    </button>
                  </div>
                </div>

                <div className="mt-16 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-10 relative z-10">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 max-w-[350px] leading-relaxed">
                      THIS DIGITAL VOUCHER IS REDEEMABLE EXCLUSIVELY FOR ELIGIBLE NON-MEDICAL AESTHETIC SERVICES WITHIN THE BEAUTY DOCTORS NETWORK.
                    </p>
                  </div>
                  <div className="text-center sm:text-right border-l-2 border-[#CBFF38] pl-6 py-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#CBFF38]">BeautyDoctors</p>
                    <p className="text-[10px] font-bold text-gray-600 mt-1">Verification Required at Checkout</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/treatments"
                  className="flex-1 h-16 bg-black text-[#CBFF38] rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <Sparkles size={18} /> Explore Treatments
                </Link>
                <Link
                  to="/my-account"
                  className="flex-1 h-16 bg-white border-2 border-gray-150 flex items-center justify-center rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:border-black transition-all group"
                >
                  {isGreek ? "Επιστροφή στον λογαριασμό" : "Back to Account"}{" "}
                  <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GiftCard;
