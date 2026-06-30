import React, { useState, useEffect } from"react";
import { useSelector } from"react-redux";
import { Link } from"react-router-dom";
import { css } from"@emotion/css";
import { ChevronRight, Copy, Share2, Gift, Users, ArrowRight, Minus, Plus, Sparkles, CheckCircle } from"lucide-react";
import type { RootState } from"@/store";
import { motion, AnimatePresence } from"framer-motion";
import { userAPI } from"@/services/api";

// Use the user's provided hero image for referral page
import HeroBg from"@/assets/invite_friend_bg.png";

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
 position: relative;
 overflow: hidden;
`;

export const InviteFriend: React.FC = () => {
 const { user } = useSelector((state: RootState) => state.auth);
 const [stats, setStats] = useState<any>(null);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 const fetchStats = async () => {
 try {
 setLoading(true);
 const res = await userAPI.getReferralStats();
 setStats(res.data);
 } catch (err) {
 console.error("Failed to fetch referral stats:", err);
 } finally {
 setLoading(false);
 }
 };
 fetchStats();
 }, []);

 const referralCode = stats?.referralCode || (user as any)?.referralCode ||"ELITE5";
 const inviteLink = `${window.location.origin}/register?ref=${referralCode}`;
 const userName = user?.firstName || 'A friend';
 const inviteMessage = `${userName} has invited you to join Beauty Doctors! \nRegister now and get €5 off your first aesthetic treatment.\n ${inviteLink}`;

 const [faqOpen, setFaqOpen] = useState<number | null>(0);
 const [copied, setCopied] = useState(false);

 const copyToClipboard = async () => {
 try {
 if (navigator.clipboard && window.isSecureContext) {
 await navigator.clipboard.writeText(inviteMessage);
 } else {
 // Fallback for HTTP or older browsers
 const textArea = document.createElement('textarea');
 textArea.value = inviteMessage;
 textArea.style.position = 'fixed';
 textArea.style.left = '-9999px';
 textArea.style.top = '-9999px';
 document.body.appendChild(textArea);
 textArea.focus();
 textArea.select();
 document.execCommand('copy');
 document.body.removeChild(textArea);
 }
 setCopied(true);
 setTimeout(() => setCopied(false), 2500);
 } catch {
 window.prompt('Copy your invitation message:', inviteMessage);
 }
 };

 const shareOnWhatsApp = () => {
 const encoded = encodeURIComponent(inviteMessage);
 window.open(`https://wa.me/?text=${encoded}`, '_blank');
 };

 const toggleFAQ = (index: number) => {
 setFaqOpen(faqOpen === index ? null : index);
 };

 const faqs = [
 {
 q:"How do I earn the €5 bonus?",
 a:"Just share your unique referral link. When they register and complete their first booking, both of you receive €5 in loyalty points.",
 },
 {
 q:"Is there a limit to invitations?",
 a:"No limit! Invite as many friends as you want and keep earning rewards for each successful booking.",
 },
 {
 q:"When will I see the bonus?",
 a:"Points are credited as soon as your friend's first appointment is marked as completed.",
 },
 ];

 return (
 <div className={sectionStyles}>
 {/* Immersive Hero */}
 <div className={heroSection}>
 <div className="absolute inset-0 z-0">
 <img
 src={HeroBg}
 style={{ objectPosition: 'center 40%' }}
 className="w-full h-full object-cover"
 alt="Referral Hero"
 />
 </div>

 <div className="container mx-auto px-4 sm:px-8 relative z-10">
 <div className="max-w-4xl">
 <div className="flex items-center gap-3 mb-6 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em]">
 <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
 <ChevronRight size={12} className="text-lime-500" />
 <span className="text-lime-500">REFERRAL PROGRAM</span>
 </div>

 <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-gray-900">
 INVITE FRIENDS <span className="text-[#CBFF38]">EARN €5</span>
 </h1>

 <p className="text-gray-500 mt-6 font-bold text-lg max-w-lg leading-relaxed">
 Share the excellence with your inner circle. Both of you receive a €5 credit when they complete their first aesthetic treatment.
 </p>
 </div>
 </div>
 </div>

 <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-20 -mt-[170px]">
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-20">

 {/* Main Action Card */}
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 className={`${glassCard} lg:col-span-3`}
 >
 <div className="p-6 sm:p-10 md:p-16">
 <div className="mb-12 flex items-center justify-between">
 <div>
 <h3 className="text-3xl font-black uppercase text-gray-900 mb-2">Personal Link</h3>
 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Your unique gateway to shared rewards</p>
 </div>
 <div className="size-16 rounded-2xl bg-[#CBFF38] flex items-center justify-center text-black">
 <Gift size={28} />
 </div>
 </div>

 <div className="flex flex-col gap-6">
 {/* Message preview box */}
 <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl sm:rounded-3xl px-4 sm:px-8 py-4 group hover:border-[#CBFF38] transition-all relative">
 <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-line pr-8">{inviteMessage}</p>
 <button
 onClick={copyToClipboard}
 className="absolute top-4 right-4 text-gray-300 hover:text-black transition-colors"
 title="Copy message"
 >
 <Copy size={18} />
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <button
 onClick={copyToClipboard}
 className={`h-14 rounded-[18px] flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 ${copied ? 'bg-[#CBFF38] text-black' : 'bg-black text-[#CBFF38] hover:bg-gray-900'
 }`}
 >
 {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
 {copied ? 'Copied!' : 'Copy Message'}
 </button>
 <button
 onClick={shareOnWhatsApp}
 className="h-14 rounded-[18px] flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] transition-all bg-[#25D366] text-white hover:bg-[#1ebe5d] shadow-xl active:scale-95"
 >
 <Share2 size={18} />
 WhatsApp
 </button>
 </div>
 </div>

 <div className="mt-16 pt-12 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
 <div className="text-center">
 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Invited</p>
 <div className="text-4xl font-black text-gray-900">
 {loading ?"..." : stats?.totalInvited ?? 0}
 </div>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Pending</p>
 <div className="text-4xl font-black text-gray-900">
 {loading ?"..." : stats?.pending ?? 0}
 </div>
 </div>
 <div className="text-center">
 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Earned</p>
 <div className="text-4xl font-black text-[#CBFF38]">
 €{loading ?"..." : (stats?.totalEarnedCash ?? 0).toFixed(2)}
 </div>
 </div>
 </div>
 </div>

 {/* Visual accent */}
 <div className="absolute right-0 bottom-0 opacity-5 -mb-8 -mr-8">
 <Users size={200} />
 </div>
 </motion.div>

 {/* How it Works / FAQ */}
 <div className="lg:col-span-2 space-y-8">
 <div className={`${glassCard} p-6 sm:p-12 bg-gray-50 border-gray-100 relative overflow-hidden`}>
 <div className="relative z-10">
 <h4 className="text-xl font-black uppercase text-gray-900 mb-8 flex items-center gap-3">
 Process Excellence
 </h4>
 <div className="space-y-8">
 {[
 { step:"01", text:"Invite a friend with your link." },
 { step:"02", text:"They complete their first treatment." },
 { step:"03", text:"Receive €5 automatically per friend." }
 ].map((s, i) => (
 <div key={i} className="flex gap-5">
 <span className="text-[10px] font-black text-[#CBFF38] bg-black size-6 rounded-full flex items-center justify-center shrink-0">{s.step}</span>
 <p className="text-[11px] font-black text-gray-600 uppercase tracking-wide leading-tight mt-1">{s.text}</p>
 </div>
 ))}
 </div>
 </div>
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <Sparkles size={32} />
 </div>
 </div>

 <div className="space-y-4">
 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 px-2">Common Questions</h4>
 <div className="bg-white rounded-[32px] border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
 {faqs.map((faq, idx) => (
 <div key={idx} className="group">
 <button
 onClick={() => toggleFAQ(idx)}
 className="w-full flex items-center justify-between px-8 py-6 text-left hover:bg-gray-50/50 transition-colors"
 >
 <span className="text-[11px] font-black uppercase text-gray-900 tracking-tight">{faq.q}</span>
 {faqOpen === idx ? <Minus size={14} className="text-[#CBFF38]" /> : <Plus size={14} className="text-gray-300" />}
 </button>
 <AnimatePresence>
 {faqOpen === idx && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height:"auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="px-8 pb-6 overflow-hidden"
 >
 <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-tighter">{faq.a}</p>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="pb-20" />
 </div>
 </div>
 );
};
