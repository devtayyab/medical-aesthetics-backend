import React, { useState } from"react";
import { useDispatch, useSelector } from"react-redux";
import { Link } from"react-router-dom";
import { Button } from"@/components/atoms/Button/Button";
import axios from"axios";
import type { RootState, AppDispatch } from"@/store";
import { css } from"@emotion/css";
import { setTokens } from"@/store/slices/authSlice";
import { motion, AnimatePresence } from"framer-motion";
import { User, Mail, Phone, Lock, CheckCircle, ChevronRight, Edit3 } from"lucide-react";
import toast from"react-hot-toast";

// Use the user's provided hero image from assets
import HeroBg from"@/assets/personal_details_bg.png";

const sectionStyles = css`
 min-height: 100vh;
 background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const heroSection = css`
 position: relative;
 min-height: 240px;
 @media (min-width: 640px) {
 height: 380px;
 }
 @media (min-width: 1024px) {
 height: 480px;
 }
 width: 100%;
 display: flex;
 align-items: center;
 overflow: hidden;
 padding: 24px 0 50px;
 @media (min-width: 640px) {
 padding: 0;
 }
 
 &::after {
 content: '';
 position: absolute;
 inset: 0;
 background: linear-gradient(to right, #FFFFFF 45%, rgba(255,255,255,0.85) 75%, transparent 100%);
 z-index: 1;
 }

 @media (max-width: 640px) {
 &::after {
 background: linear-gradient(to top, #FFFFFF 15%, rgba(255,255,255,0.92) 75%, transparent 100%);
 }
 }
`;

const glassCard = css`
 background: white;
 border-radius: 20px;
 box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
 border: 1px solid #F1F5F9;
 padding: 20px 16px;
 @media (min-width: 640px) {
 border-radius: 40px;
 padding: 48px;
 box-shadow: 0 20px 80px rgba(0, 0, 0, 0.05);
 }
 width: 100%;
 max-width: 1000px;
 margin: -30px auto 40px;
 @media (min-width: 640px) {
 margin: -80px auto 40px;
 }
 @media (min-width: 1024px) {
 margin: -120px auto 40px;
 }
 position: relative;
 z-index: 10;
`;

const inputGroup = css`
 margin-bottom: 20px;
 @media (min-width: 640px) {
 margin-bottom: 32px;
 }
 
 label {
 display: block;
 font-size: 10px;
 font-weight: 800;
 text-transform: uppercase;
 letter-spacing: 0.15em;
 color: #94A3B8;
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
 height: 64px;
 padding: 0 28px 0 60px;
 }
 background: #F8FAFC;
 border: 1px solid #F1F5F9;
 border-radius: 14px;
 @media (min-width: 640px) {
 border-radius: 20px;
 }
 font-weight: 700;
 color: #1E293B;
 transition: all 0.3s ease;
 font-size: 14px;
 @media (min-width: 640px) {
 font-size: 16px;
 }

 &:focus {
 background: white;
 border-color: #CBFF38;
 box-shadow: 0 10px 30px -10px rgba(203, 255, 56, 0.2);
 outline: none;
 }

 &:disabled {
 cursor: not-allowed;
 background: #F8FAFC;
 color: #64748B;
 }
 }

 .icon {
 position: absolute;
 left: 16px;
 @media (min-width: 640px) {
 left: 24px;
 }
 color: #CBD5E1;
 width: 18px;
 height: 18px;
 @media (min-width: 640px) {
 width: 20px;
 height: 20px;
 }
 }
 
 .lock-icon {
 position: absolute;
 right: 16px;
 @media (min-width: 640px) {
 right: 24px;
 }
 color: #CBD5E1;
 }
 }
`;

export const PersonalDetails: React.FC = () => {
 const dispatch = useDispatch<AppDispatch>();
 const { user, accessToken, refreshToken } = useSelector((state: RootState) => state.auth);

 const [isEditing, setIsEditing] = useState(false);
 const [firstName, setFirstName] = useState(user?.firstName ||"");
 const [lastName, setLastName] = useState(user?.lastName ||"");
 const [phone, setPhone] = useState(user?.phone ||"");
 const [isLoading, setIsLoading] = useState(false);

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 
 // Basic validation
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
 let currentToken = accessToken;
 const tRefresh = refreshToken || localStorage.getItem("refreshToken");

 if (tRefresh) {
 const refreshRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL ||"/api"}/auth/refresh`, { refreshToken: tRefresh });
 currentToken = refreshRes.data.accessToken;
 dispatch(setTokens({ accessToken: currentToken, refreshToken: refreshRes.data.refreshToken }));
 }

 await axios.patch(`${import.meta.env.VITE_API_BASE_URL ||"/api"}/users/me/profile`,
 { firstName, lastName, phone },
 { headers: { Authorization: `Bearer ${currentToken}` } }
 );

 toast.success("Profile updated successfully");
 setIsEditing(false);
 } catch (err: any) {
 toast.error(err.response?.data?.message ||"Failed to update profile");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className={sectionStyles}>
 {/* Immersive Hero */}
 <div className={heroSection}>
 <div className="absolute top-0 right-0 bottom-0 w-2/3 lg:w-1/2 z-0">
 <img
 src={HeroBg}
 style={{ objectPosition: 'center center' }}
 className="w-full h-full object-cover"
 alt="Clinic Hero"
 />
 </div>

 <div className="container mx-auto px-4 sm:px-8 relative z-10">
 <div className="max-w-2xl">
 <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-6 text-gray-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em]">
 <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
 <ChevronRight size={12} className="text-lime-600" />
 <span className="text-lime-600 font-extrabold">PROFILE MANAGEMENT</span>
 </div>

 <h1 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight text-gray-900">
 PERSONAL <span className="text-[#84cc16] sm:text-[#CBFF38]">DETAILS</span>
 </h1>

 <p className="text-gray-600 mt-2 sm:mt-4 font-semibold text-xs sm:text-base max-w-lg leading-snug sm:leading-relaxed">
 Keep your account details up to date to receive the best service and personalized treatment plans.
 </p>
 </div>
 </div>
 </div>

 {/* Details Card */}
 <div className="px-3 sm:px-8">
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 className={glassCard}
 >
 <form onSubmit={handleSave}>
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-12 pb-6 sm:pb-8 border-b border-gray-100/80">
 <div className="flex items-center gap-4 sm:gap-6">
 <div className="size-12 sm:size-20 rounded-[16px] sm:rounded-[24px] bg-lime-500/10 flex items-center justify-center text-lime-600 shadow-inner shrink-0">
 <User className="size-6 sm:size-8" />
 </div>
 <div>
 <h3 className="text-lg sm:text-2xl font-black uppercase text-gray-900 tracking-tight">Information</h3>
 <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-0.5 sm:mt-1">Profile Identity Settings</p>
 </div>
 </div>

 {!isEditing ? (
 <button
 type="button"
 onClick={() => setIsEditing(true)}
 className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 bg-gradient-to-br from-[#A3E635] to-[#86efac] sm:from-[#CBFF38] sm:to-[#B6EF2B] hover:from-black hover:to-gray-900 hover:text-[#CBFF38] text-black text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2.5 sm:gap-3 group"
 >
 <Edit3 size={16} className="group-hover:rotate-12 transition-transform" />
 Edit Profile
 </button>
 ) : (
 <div className="w-full sm:w-auto flex items-center justify-end gap-3 sm:gap-4">
 <button
 type="button"
 onClick={() => setIsEditing(false)}
 className="h-12 sm:h-14 px-4 sm:px-8 text-gray-400 hover:text-red-500 text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isLoading}
 className="h-12 sm:h-14 px-6 sm:px-10 bg-gradient-to-br from-black to-gray-800 text-[#CBFF38] hover:from-[#CBFF38] hover:to-[#B6EF2B] hover:text-black text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-2xl flex items-center gap-3"
 >
 {isLoading ?"Saving..." :"Save Changes"}
 </button>
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
 <div className={inputGroup}>
 <label>First Name</label>
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
 <label>Last Name</label>
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
 <label>Email Address</label>
 <div className="input-wrapper">
 <Mail className="icon" />
 <input
 type="email"
 value={user?.email ||""}
 disabled
 placeholder="Email Address"
 />
 <Lock className="lock-icon" size={16} />
 </div>
 </div>

 <div className={inputGroup}>
 <label>Phone Number</label>
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

 <div className="mt-8 pt-8 border-t border-gray-50 flex items-center gap-3">
 <div className="size-2 rounded-full bg-[#CBFF38] animate-pulse" />
 <p className="text-[11px] font-black uppercase tracking-[0.1em] text-gray-400">
 JOINED {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : 'NOVEMBER 2025'}
 </p>
 </div>
 </form>
 </motion.div>
 </div>
 </div>
 );
};
