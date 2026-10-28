import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { updateProfile } from "@/store/slices/authSlice";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, ChevronRight, Edit3, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

// High-clarity hero portrait
import HeroBg from "@/assets/personal detailis.jpg.jpeg";
import { formatDate } from "@/utils/formatters";

const glassCard = css`
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px;
  @media (min-width: 640px) {
    border-radius: 36px;
  }
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  padding: 24px 20px;
  @media (min-width: 640px) {
    padding: 44px 48px;
  }
  width: 100%;
  max-width: 1050px;
  margin: 0 auto 50px;
  position: relative;
  z-index: 20;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(203, 255, 56, 0.6);
    box-shadow: 0 35px 70px -15px rgba(203, 255, 56, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

const inputGroup = css`
  margin-bottom: 22px;
  @media (min-width: 640px) {
    margin-bottom: 30px;
  }
  
  label {
    display: block;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #64748B;
    margin-bottom: 8px;
    margin-left: 2px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    input {
      width: 100%;
      height: 52px;
      padding: 0 18px 0 48px;
      @media (min-width: 640px) {
        height: 60px;
        padding: 0 24px 0 56px;
      }
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 16px;
      @media (min-width: 640px) {
        border-radius: 20px;
      }
      font-weight: 700;
      color: #0F172A;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
      @media (min-width: 640px) {
        font-size: 15px;
      }

      &:focus {
        background: rgba(255, 255, 255, 0.95);
        border-color: #CBFF38;
        box-shadow: 0 0 0 3px rgba(203, 255, 56, 0.25), 0 10px 25px -10px rgba(0, 0, 0, 0.05);
        outline: none;
      }

      &:disabled {
        cursor: not-allowed;
        background: rgba(248, 250, 252, 0.55);
        color: #64748B;
      }
    }

    .icon {
      position: absolute;
      left: 16px;
      @media (min-width: 640px) {
        left: 20px;
      }
      color: #94A3B8;
      width: 18px;
      height: 18px;
      transition: color 0.3s ease;
    }

    &:focus-within .icon {
      color: #84CC16;
    }

    .lock-icon {
      position: absolute;
      right: 16px;
      @media (min-width: 640px) {
        right: 20px;
      }
      color: #94A3B8;
    }
  }
`;

export const PersonalDetails: React.FC = () => {
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
  const { user } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      // The shared API client sends the session cookie and refreshes it when needed.
      await dispatch(updateProfile({ firstName, lastName, phone })).unwrap();

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (typeof err === "string" ? err : "Failed to update profile"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden">
      {/* Background Hero Portrait - 100% Crisp, natural clarity & warmth */}
      <div className="absolute top-0 right-0 h-[520px] sm:h-[620px] lg:h-[700px] w-full sm:w-2/3 lg:w-3/5 z-0 pointer-events-none overflow-hidden opacity-40 sm:opacity-90 lg:opacity-100 transition-opacity duration-300">
        <img
          src={HeroBg}
          style={{ objectPosition: 'right 15%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover object-right"
          alt="Personal Details Hero"
        />
        {/* Soft left gradient fade to blend smoothly into background */}
        <div className="absolute inset-y-0 left-0 w-28 sm:w-48 bg-gradient-to-r from-[#F8FAFC] to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1250px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-24">
        {/* Page Title & Floating Glass Breadcrumbs */}
        <div className="max-w-xl mb-10 sm:mb-14">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 sm:mb-6"
          >
            <Link to="/my-account" className="text-gray-900 border-b border-gray-900/30 hover:border-black pb-0.5">
              {isGreek ? "ΛΟΓΑΡΙΑΣΜΟΣ" : "ACCOUNT"}
            </Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">
              {isGreek ? "ΔΙΑΧΕΙΡΙΣΗ ΠΡΟΦΙΛ" : "PROFILE MANAGEMENT"}
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-gray-900 drop-shadow-sm"
          >
            {isGreek ? "ΠΡΟΣΩΠΙΚΑ ΣΤΟΙΧΕΙΑ" : <>PERSONAL <span className="text-[#84cc16] sm:text-[#a3e635]">DETAILS</span></>}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-5 font-bold text-xs sm:text-base max-w-lg leading-relaxed"
          >
            {isGreek 
              ? "Διατηρήστε τα στοιχεία σας ενημερωμένα για τα ραντεβού σας, τις ειδοποιήσεις λογαριασμού και την επικοινωνία με τις επιλεγμένες κλινικές και ιατρούς." 
              : "Keep your account details up to date for appointments, account notifications and communication with your selected clinics and doctors."}
          </motion.p>
        </div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={glassCard}
        >
          <form onSubmit={handleSave}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-gray-200/60">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="size-14 sm:size-18 rounded-[20px] sm:rounded-[24px] bg-black text-[#CBFF38] flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
                  <User className="size-6 sm:size-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase text-gray-900 tracking-tight">
                    {isGreek ? "Στοιχεία προφίλ" : "Information"}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.18em] mt-0.5 sm:mt-1">
                    {isGreek ? "Προσωπικά στοιχεία" : "Profile Identity Settings"}
                  </p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 bg-black text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 shadow-xl flex items-center justify-center gap-2.5 group active:scale-[0.98]"
                >
                  <Edit3 size={15} className="group-hover:rotate-12 transition-transform" />
                  {isGreek ? "Επεξεργασία στοιχείων" : "Edit Profile"}
                </button>
              ) : (
                <div className="w-full sm:w-auto flex items-center justify-end gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        setFirstName(user.firstName || "");
                        setLastName(user.lastName || "");
                        setPhone(user.phone || "");
                      }
                    }}
                    className="h-12 sm:h-14 px-4 sm:px-7 text-gray-500 hover:text-red-500 text-xs font-black uppercase tracking-[0.18em] transition-colors"
                  >
                    {isGreek ? "Ακύρωση" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 sm:h-14 px-6 sm:px-10 bg-[#CBFF38] text-black hover:bg-black hover:text-[#CBFF38] text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 shadow-xl flex items-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading 
                      ? (isGreek ? "Αποθήκευση..." : "Saving...") 
                      : (isGreek ? "Αποθήκευση αλλαγών" : "Save Changes")}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <div className={inputGroup}>
                <label>{isGreek ? "Όνομα" : "First Name"}</label>
                <div className="input-wrapper">
                  <User className="icon" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="First Name"
                  />
                </div>
              </div>

              <div className={inputGroup}>
                <label>{isGreek ? "Επώνυμο" : "Last Name"}</label>
                <div className="input-wrapper">
                  <User className="icon" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div className={inputGroup}>
                <label>{isGreek ? "Διεύθυνση Email" : "Email Address"}</label>
                <div className="input-wrapper">
                  <Mail className="icon" />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    placeholder="Email Address"
                  />
                  <Lock className="lock-icon" size={16} />
                </div>
              </div>

              <div className={inputGroup}>
                <label>{isGreek ? "Τηλέφωνο επικοινωνίας" : "Phone Number"}</label>
                <div className="input-wrapper">
                  <Phone className="icon" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/70 border border-white/85 shadow-sm backdrop-blur-sm">
                <div className="size-2 rounded-full bg-[#CBFF38] animate-pulse" />
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">
                  JOINED {user?.createdAt ? formatDate(user.createdAt) : ''}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                <ShieldCheck size={14} className="text-[#84cc16]" />
                <span>Verified Client Profile</span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
