import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import axios from "axios";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { setTokens } from "@/store/slices/authSlice";
import { FaChevronRight, FaUser, FaPhone, FaEnvelope, FaLock, FaCircleCheck } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";

const sectionStyles = css`
  min-height: 100vh;
  background: #FDFDFD;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const glassCard = css`
  background: white;
  border: 1px solid rgba(241, 245, 249, 1);
  border-radius: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01);
  padding: 40px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.06);
    border-color: rgba(203, 255, 56, 0.5);
  }
`;

const inputGroup = css`
  margin-bottom: 24px;
  position: relative;
  
  label {
    display: block;
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94A3B8;
    margin-bottom: 8px;
    margin-left: 4px;
    font-italic: italic;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    input {
      width: 100%;
      height: 60px;
      padding: 0 24px 0 54px;
      background: #F8FAFC;
      border: 2px solid #F1F5F9;
      border-radius: 18px;
      font-weight: 700;
      color: #1E293B;
      transition: all 0.3s ease;
      font-size: 16px;

      &:focus {
        background: white;
        border-color: #CBFF38;
        box-shadow: 0 10px 20px -10px rgba(203, 255, 56, 0.3);
        outline: none;
      }

      &::placeholder {
        color: #CBD5E1;
        font-italic: italic;
      }
    }

    .icon {
      position: absolute;
      left: 20px;
      color: #94A3B8;
      transition: all 0.3s ease;
    }

    &:focus-within .icon {
      color: #1A1A1A;
    }
  }
`;

export const PersonalDetails: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessToken, refreshToken } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let currentToken = accessToken;
      const tRefresh = refreshToken || localStorage.getItem("refreshToken");
      
      if (tRefresh) {
        const refreshRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/refresh`, { refreshToken: tRefresh });
        currentToken = refreshRes.data.accessToken;
        dispatch(setTokens({ accessToken: currentToken, refreshToken: refreshRes.data.refreshToken }));
      }

      await axios.patch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/users/me/profile`, 
        { firstName, lastName, phone },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
            <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
            <FaChevronRight size={10} />
            <span>Profile Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">
            Personal Details
          </h1>
          <p className="text-gray-400 mt-2 font-medium max-w-lg">
            Keep your account information accurate to receive the best service and tailored treatment plans.
          </p>
        </div>
        
        {/* Decorative mask */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={glassCard}
        >
          <form onSubmit={handleSave}>
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <FaUser size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic text-gray-900">Information</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Identity Settings</p>
                </div>
              </div>
              
              {!isEditing ? (
                <Button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="h-10 px-6 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-10 px-5 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <Button 
                    type="submit"
                    isLoading={isLoading}
                    className="h-10 px-6 bg-[#CBFF38] text-black hover:bg-lime-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="bg-lime-50 border border-lime-100 p-4 rounded-2xl flex items-center gap-3 text-lime-700">
                    <FaCircleCheck className="shrink-0" />
                    <span className="text-sm font-bold uppercase tracking-tight italic">Success! Your profile info has been updated.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mb-8 bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-tight italic">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {/* First Name */}
              <div className={inputGroup}>
                <label>First Name</label>
                <div className="input-wrapper">
                  <FaUser className="icon" />
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Abdullah"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className={inputGroup}>
                <label>Last Name</label>
                <div className="input-wrapper">
                  <FaUser className="icon" />
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Khan"
                  />
                </div>
              </div>

              {/* Email (Disabled) */}
              <div className={inputGroup}>
                <label>Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="icon" />
                  <input 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="opacity-60 cursor-not-allowed"
                    placeholder="email@example.com"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <FaLock className="text-gray-300" size={14} />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className={inputGroup}>
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <FaPhone className="icon" />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="+92 3XX XXXXXXX"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
               <div className="flex items-center gap-3 text-gray-400">
                  <div className="size-1.5 rounded-full bg-gray-200" />
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] italic">
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2026'}
                  </p>
               </div>
            </div>
          </form>
        </motion.div>

        {/* Security Section (Placeholder for UI completeness) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${glassCard} mt-8 bg-gray-50/50`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center border border-black shadow-lg">
                <FaLock size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic text-gray-900">Security</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update your password</p>
              </div>
            </div>
            <Button 
              variant="outline"
              className="h-10 px-6 border-2 border-gray-200 text-gray-600 hover:border-black hover:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Change Password
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
