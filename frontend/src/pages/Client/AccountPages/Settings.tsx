import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { updateProfile, logout } from "@/store/slices/authSlice";
import { userAPI } from "@/services/api";
import { css } from "@emotion/css";
import { ChevronRight, Bell, Trash2, CheckCircle2, Mail, Sparkles, AlertCircle, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Clinical hero visual
import HeroBg from "@/assets/Settings_Hero_New.png";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FAFAFA;
`;

const glassCard = css`
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 28px;
  @media (min-width: 640px) {
    border-radius: 36px;
  }
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(203, 255, 56, 0.6);
    box-shadow: 0 35px 70px -15px rgba(203, 255, 56, 0.12), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

const dangerGlassCard = css`
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-radius: 28px;
  @media (min-width: 640px) {
    border-radius: 36px;
  }
  border: 1px solid rgba(254, 202, 202, 0.8);
  box-shadow: 0 30px 60px -15px rgba(239, 68, 68, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(239, 68, 68, 0.6);
    box-shadow: 0 35px 70px -15px rgba(239, 68, 68, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

const toggleSwitch = (active: boolean) => css`
  width: 52px;
  min-width: 52px;
  height: 28px;
  background: ${active ? '#CBFF38' : 'rgba(226, 232, 240, 0.75)'};
  backdrop-filter: blur(8px);
  border-radius: 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid ${active ? '#B6EF2B' : 'rgba(203, 213, 225, 0.7)'};
  box-shadow: ${active ? '0 0 16px rgba(203, 255, 56, 0.45)' : 'inset 0 1px 2px rgba(0,0,0,0.06)'};

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${active ? '27px' : '3px'};
    width: 20px;
    height: 20px;
    background: ${active ? '#000000' : '#FFFFFF'};
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 5px rgba(0,0,0,0.18);
  }
`;

export const Settings: React.FC = () => {
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

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading: authLoading } = useSelector((state: RootState) => state.auth);

  const defaultSettings = {
    inspirationOffers: {
      sms: false,
      email: false, // Default OFF as per GDPR opt-in rules
      push: true,
    },
    privacy: {
      shareData: true,
      publicProfile: false
    }
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user || !authLoading) {
      setLoaded(true);
    }
    if (user) {
      setSettings((prev) => ({
        ...prev,
        ...(user.profile?.settings || {}),
        inspirationOffers: {
          ...prev.inspirationOffers,
          ...(user.profile?.settings?.inspirationOffers || {}),
          email: user.marketingEmailConsent ?? false
        },
        privacy: {
          ...prev.privacy,
          ...(user.profile?.settings?.privacy || {})
        }
      }));
    }
  }, [user, authLoading]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionSuccessMsg, setDeletionSuccessMsg] = useState<string | null>(null);

  const isPendingDeletion = user?.profile?.deletionStatus === 'pending';

  const handleConfirmDeletionRequest = async () => {
    setIsDeactivating(true);
    try {
      await userAPI.deactivateData();
      // Update local profile state
      const updatedProfile = {
        ...(user?.profile || {}),
        deletionRequestedAt: new Date().toISOString(),
        deletionStatus: 'pending' as const,
      };
      await dispatch(updateProfile({ profile: updatedProfile })).unwrap();
      setShowDeleteModal(false);
      setDeletionSuccessMsg(
        isGreek
          ? "Το αίτημα διαγραφής υποβλήθηκε. Ο λογαριασμός σας βρίσκεται σε περίοδο χάριτος."
          : "Your account deletion request has been submitted. Your account is now in a grace period."
      );
      setTimeout(() => setDeletionSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error("Failed to deactivate account:", err);
      alert(err.response?.data?.message || "Failed to submit account deletion request. Please try again.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancelling(true);
    try {
      await userAPI.cancelDeletion();
      const updatedProfile = {
        ...(user?.profile || {}),
        deletionRequestedAt: null,
        deletionStatus: 'active' as const,
      };
      await dispatch(updateProfile({ profile: updatedProfile })).unwrap();
      setDeletionSuccessMsg(
        isGreek
          ? "Το αίτημα διαγραφής ακυρώθηκε επιτυχώς."
          : "Account deletion request has been successfully cancelled."
      );
      setTimeout(() => setDeletionSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error("Failed to cancel account deletion:", err);
      alert(err.response?.data?.message || "Failed to cancel account deletion.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeactivating(true);
    try {
      await userAPI.permanentDelete();
      dispatch(logout());
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error("Failed to permanently delete account:", err);
      alert(err.response?.data?.message || "Failed to permanently delete account.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const toggle = async (section: keyof typeof settings, key: string) => {
    const newValue = !(settings[section] as any)[key];
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: newValue,
      },
    };
    
    setSettings(newSettings);
    
    try {
      const updatePayload: any = {
        profile: {
          ...(user?.profile || {}),
          settings: newSettings
        }
      };

      if (section === 'inspirationOffers' && key === 'email') {
        updatePayload.marketingEmailConsent = newValue;
      }

      await dispatch(updateProfile(updatePayload)).unwrap();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  if (!loaded) {
    return (
      <div className={sectionStyles}>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="size-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const notificationOptions = [
    {
      section: 'inspirationOffers' as const,
      key: 'email',
      label: isGreek ? 'Ενημερώσεις & Νέα' : 'Newsletters & Updates',
      d: isGreek 
        ? 'Λάβετε νέα, πληροφορίες θεραπειών και ενημερώσεις από το Beauty Doctors μέσω email.' 
        : 'Receive Beauty Doctors news, treatment information and updates by email.',
      icon: <Mail className="size-4 sm:size-5 text-gray-900" />,
      badge: isGreek ? 'Email' : 'Email Digest'
    },
    {
      section: 'inspirationOffers' as const,
      key: 'push',
      label: isGreek ? 'Ειδοποιήσεις Εφαρμογής' : 'Application Alerts',
      d: isGreek 
        ? 'Λάβετε σημαντικές ειδοποιήσεις για τα ραντεβού σας και τη δραστηριότητα του λογαριασμού σας.' 
        : 'Receive important notifications about your appointments and account activity.',
      icon: <Bell className="size-4 sm:size-5 text-gray-900" />,
      badge: isGreek ? 'Άμεσες' : 'Push Alerts'
    },
  ];

  return (
    <div className={`${sectionStyles} relative overflow-x-hidden`}>
      {/* Immersive Hero Header with High-Clarity Visual */}
      <div className="relative pt-20 sm:pt-28 pb-52 sm:pb-72 overflow-hidden min-h-[420px] sm:min-h-[520px]">
        {/* Background Visual - 100% Crisp, zero blur, natural clarity */}
        <div className="absolute inset-0 z-0">
          <img 
            src={HeroBg} 
            style={{ objectPosition: 'center 38%' }}
            className="w-full h-full object-cover" 
            alt="Settings Clinical Hero" 
          />
          {/* Subtle Left Ambient Gradient strictly behind text area so clinic interior & screen remain 100% uncovered */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/85 via-white/30 to-transparent pointer-events-none" />
          {/* Soft bottom blend into page content */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#FAFAFA] to-transparent pointer-events-none" />
        </div>

        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-4xl">
            {/* Floating Glass Breadcrumb Pill */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-gray-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-6"
            >
              <Link to="/my-account" className="text-gray-900 hover:text-black transition-colors border-b border-gray-900/30 hover:border-black pb-0.5">
                {isGreek ? "ΛΟΓΑΡΙΑΣΜΟΣ" : "ACCOUNT"}
              </Link>
              <ChevronRight size={12} className="text-[#84cc16]" />
              <span className="text-[#84cc16] font-extrabold">{isGreek ? "ΠΡΟΤΙΜΗΣΕΙΣ" : "PREFERENCES"}</span>
            </motion.div>
            
            {/* Main Title & Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none text-gray-900 drop-shadow-sm">
                {isGreek ? "ΡΥΘΜΙΣΕΙΣ ΛΟΓΑΡΙΑΣΜΟΥ" : <>ACCOUNT <span className="text-[#84cc16] sm:text-[#a3e635]">SETTINGS</span></>}
              </h1>
              
              <p className="text-gray-600 mt-4 sm:mt-5 font-bold text-sm sm:text-base max-w-xl leading-relaxed">
                {isGreek 
                  ? "Διαχειριστείτε τις ειδοποιήσεις, τις προτιμήσεις επικοινωνίας και την ασφάλεια του λογαριασμού σας." 
                  : "Manage your notifications, communication preferences, and account security."}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Settings Main Content Area - Transparent Frosted Cards Overlapping Hero */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 relative z-20 -mt-[130px] sm:-mt-[190px] pb-28 sm:pb-36">
        <div className="space-y-8 sm:space-y-10">
          
          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-black text-[#CBFF38] px-8 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 backdrop-blur-md"
              >
                <CheckCircle2 size={18} />
                <span className="text-[11px] font-black uppercase tracking-[0.25em]">
                  {isGreek ? "ΟΙ ΡΥΘΜΙΣΕΙΣ ΕΝΗΜΕΡΩΘΗΚΑΝ" : "Preferences Updated"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications Card - Transparent Frosted Glass */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={glassCard}
          >
            <div className="p-6 sm:p-10 md:p-12">
              <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-200/50">
                <div className="size-14 sm:size-16 shrink-0 rounded-2xl sm:rounded-3xl bg-[#CBFF38]/20 flex items-center justify-center text-black border border-[#CBFF38]/40 shadow-sm backdrop-blur-md">
                  <Bell size={26} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase text-gray-900 tracking-tight">
                    {isGreek ? "Ειδοποιήσεις" : "Notifications"}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                    {isGreek ? "Διαχείριση ειδοποιήσεων και προτιμήσεων επικοινωνίας" : "Manage service notifications & marketing preferences"}
                  </p>
                </div>
              </div>

              {/* Toggles List */}
              <div className="space-y-4 sm:space-y-5">
                {notificationOptions.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/45 hover:bg-white/70 border border-white/60 hover:border-white transition-all duration-300 shadow-sm hover:shadow-md group"
                  >
                    <div className="max-w-md">
                      <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5">
                        <div className="size-8 sm:size-9 rounded-xl bg-[#CBFF38]/25 text-black flex items-center justify-center shrink-0 border border-[#CBFF38]/30 group-hover:scale-105 transition-transform">
                          {item.icon}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-black uppercase text-gray-900 tracking-tight text-sm sm:text-base">
                            {item.label}
                          </p>
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/5 text-gray-600 border border-black/5">
                            {item.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs font-semibold text-gray-500 leading-relaxed pl-10 sm:pl-12">
                        {item.d}
                      </p>
                    </div>
                    <div 
                      className={toggleSwitch((settings as any)[item.section][item.key])} 
                      onClick={() => toggle(item.section as any, item.key)}
                      role="switch"
                      aria-checked={(settings as any)[item.section][item.key]}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggle(item.section as any, item.key);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Deletion Success Banner */}
          <AnimatePresence>
            {deletionSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-[#CBFF38]/20 border border-[#CBFF38]/80 backdrop-blur-md flex items-center gap-3 text-black font-bold text-xs uppercase tracking-wider"
              >
                <CheckCircle2 size={18} className="text-black" />
                <span>{deletionSuccessMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Danger Card - Transparent Frosted Glass with Crimson Accents */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={dangerGlassCard}
          >
            <div className="p-6 sm:p-10 md:p-12 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-red-100/60">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="size-14 sm:size-16 shrink-0 rounded-2xl sm:rounded-3xl bg-red-500/10 flex items-center justify-center text-red-600 border border-red-200/50 shadow-sm group-hover:scale-105 transition-transform">
                    <Trash2 size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-red-600 tracking-tighter">
                      {isGreek ? "ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ" : "DELETE ACCOUNT"}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {isPendingDeletion
                        ? (isGreek ? "ΕΚΚΡΕΜΕΙ ΑΙΤΗΜΑ ΔΙΑΓΡΑΦΗΣ (ΠΕΡΙΟΔΟΣ ΧΑΡΙΤΟΣ)" : "DELETION REQUEST PENDING (GRACE PERIOD ACTIVE)")
                        : (isGreek ? "Αίτημα διαγραφής του λογαριασμού σας Beauty Doctors." : "Request deletion of your Beauty Doctors account.")}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {isPendingDeletion ? (
                    <>
                      <button 
                        onClick={handleCancelDeletion}
                        disabled={isCancelling}
                        className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-[#CBFF38] text-black hover:bg-black hover:text-white font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] transition-all duration-300 shadow-xl border border-black/10 active:scale-95 shrink-0"
                      >
                        {isCancelling 
                          ? (isGreek ? "ΑΚΥΡΩΣΗ..." : "CANCELLING...") 
                          : (isGreek ? "ΑΚΥΡΩΣΗ ΑΙΤΗΜΑΤΟΣ" : "CANCEL DELETION REQUEST")}
                      </button>
                      <button 
                        onClick={handlePermanentDelete}
                        disabled={isDeactivating}
                        className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-red-600 text-white hover:bg-red-700 font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] transition-all duration-300 shadow-xl border border-white/10 active:scale-95 shrink-0"
                      >
                        {isDeactivating 
                          ? (isGreek ? "ΕΠΕΞΕΡΓΑΣΙΑ..." : "PROCESSING...") 
                          : (isGreek ? "ΑΜΕΣΗ ΔΙΑΓΡΑΦΗ" : "DELETE IMMEDIATELY")}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeactivating}
                      className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-black text-white hover:bg-red-600 font-black uppercase text-[10px] sm:text-[11px] tracking-[0.25em] transition-all duration-300 shadow-xl border border-white/10 active:scale-95 shrink-0"
                    >
                      {isDeactivating 
                        ? (isGreek ? "ΕΠΕΞΕΡΓΑΣΙΑ..." : "PROCESSING...") 
                        : (isGreek ? "ΑΙΤΗΜΑ ΔΙΑΓΡΑΦΗΣ" : "REQUEST ACCOUNT DELETION")}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Deletion Legal Retention Disclaimer */}
              <div className="mt-6 p-4 rounded-2xl bg-red-500/[0.06] backdrop-blur-md border border-red-200/50 text-left w-full flex items-start gap-3">
                <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-900/90 font-medium leading-relaxed">
                  {isGreek 
                    ? "* Η διαγραφή του λογαριασμού σας στο BeautyDoctors δεν συνεπάγεται απαραίτητα τη διαγραφή ιατρικών αρχείων που τηρούνται ανεξάρτητα από ιατρούς ή κλινικές, ή πληροφοριών που απαιτείται να διατηρούνται βάσει νόμου." 
                    : "* Deleting your Beauty Doctors account does not necessarily delete medical records held independently by doctors or clinics, or information that must be retained where required by law."}
                </p>
              </div>
            </div>

            {/* Subtle red hazard aura on corner */}
            <div className="absolute top-0 right-0 w-48 h-full bg-red-500/[0.03] -skew-x-12 translate-x-16 pointer-events-none" />
          </motion.div>

          {/* Frosted Glass Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  className="w-full max-w-lg bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/90 shadow-2xl relative overflow-hidden"
                >
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="absolute top-5 right-5 size-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 border border-red-200/60">
                      <Trash2 size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase text-gray-950 tracking-tight">
                        {isGreek ? "Επιβεβαίωση Αιτήματος Διαγραφής" : "Confirm Account Deletion"}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {isGreek ? "Κανονισμός GDPR & Περίοδος Χάριτος" : "GDPR Compliance & Grace Period"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed mb-4">
                    {isGreek
                      ? "Είστε σίγουροι ότι επιθυμείτε να υποβάλετε αίτημα διαγραφής του λογαριασμού σας; Ο λογαριασμός σας θα τεθεί σε περίοδο χάριτος και μπορείτε να ακυρώσετε το αίτημα ανά πάσα στιγμή."
                      : "Are you sure you want to request account deletion? Your account will enter a grace period, during which you can cancel the request at any time before final anonymization."}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-red-500/[0.08] border border-red-200/70 mb-6 flex items-start gap-2.5">
                    <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-950 leading-relaxed font-medium">
                      {isGreek
                        ? "* Η διαγραφή του λογαριασμού σας δεν συνεπάγεται διαγραφή ιατρικών αρχείων που τηρούνται ανεξάρτητα από κλινικές ή ιατρούς βάσει νόμου."
                        : "* Deleting your account does not necessarily delete medical records held independently by doctors or clinics, or information required by law."}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      {isGreek ? "ΑΚΥΡΩΣΗ" : "CANCEL"}
                    </button>
                    <button
                      onClick={handleConfirmDeletionRequest}
                      disabled={isDeactivating}
                      className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
                    >
                      {isDeactivating 
                        ? (isGreek ? "ΕΠΕΞΕΡΓΑΣΙΑ..." : "PROCESSING...") 
                        : (isGreek ? "ΥΠΟΒΟΛΗ ΑΙΤΗΜΑΤΟΣ" : "CONFIRM REQUEST")}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Insignia */}
          <div className="flex flex-col items-center justify-center pt-6">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-sm">
              <Sparkles size={16} className="text-[#84cc16]" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Secure Clinical Environment
              </p>
              <ShieldCheck size={16} className="text-gray-400" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

