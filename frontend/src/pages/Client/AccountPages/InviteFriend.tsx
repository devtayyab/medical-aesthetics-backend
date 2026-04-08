import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaChevronDown, FaChevronUp, FaCopy, FaShareNodes, FaGift, FaUsers, FaArrowRight } from "react-icons/fa6";
import type { RootState } from "@/store";
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
  padding: 40px;
  position: relative;
  overflow: hidden;
`;

export const InviteFriend: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const referralCode = (user as any)?.referralCode || "GET5NOW";
  const inviteLink = `${window.location.origin}/register?ref=${referralCode}`;

  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFAQ = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    {
      q: "How do I earn the €5 bonus?",
      a: "Just share your unique referral link. When they register and complete their first booking, both of you receive €5 in loyalty points.",
    },
    {
      q: "Is there a limit to invitations?",
      a: "No limit! Invite as many friends as you want and keep earning rewards for each successful booking.",
    },
    {
      q: "When will I see the bonus?",
      a: "Points are credited as soon as your friend's first appointment is marked as completed.",
    },
  ];

  return (
    <div className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
                <FaChevronRight size={10} />
                <span>Referral Program</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] mb-4">
                Invite Friends <br className="hidden md:block" /> <span className="text-[#CBFF38]">Earn €5</span>
              </h1>
              <p className="text-gray-400 font-medium text-lg max-w-lg mx-auto md:mx-0">
                Share the beauty with your inner circle. Both of you get €5 when they book their first treatment.
              </p>
            </div>
            
            <div className="hidden lg:block relative">
               <div className="size-48 rounded-[40px] bg-[#CBFF38] flex items-center justify-center rotate-12 shadow-[0_0_50px_rgba(203,255,56,0.2)]">
                  <FaGift size={64} className="text-black" />
               </div>
               <div className="absolute -top-4 -right-4 size-20 rounded-2xl bg-white flex items-center justify-center rotate-[-12deg] shadow-xl">
                  <FaUsers size={24} className="text-black" />
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Main Action Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${premiumCard} lg:col-span-3 !p-10`}
          >
            <div className="mb-10">
               <h3 className="text-2xl font-black uppercase italic text-gray-900 mb-2">Your Personal Link</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Share this link to start earning credits</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl px-6 flex items-center justify-between group hover:border-[#CBFF38] transition-colors">
                <code className="text-sm font-black text-gray-600 truncate">{inviteLink}</code>
                <button 
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <FaCopy size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={copyToClipboard}
                  className={`h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest transition-all ${copied ? 'bg-black text-[#CBFF38]' : 'bg-[#CBFF38] text-black hover:bg-lime-400'}`}
                >
                  <FaCopy /> {copied ? 'Copied' : 'Copy Link'}
                </button>
                <button 
                  className="h-14 rounded-2xl bg-white border-2 border-gray-200 text-gray-900 hover:border-black flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest transition-all"
                >
                  <FaShareNodes /> Share
                </button>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-gray-100 grid grid-cols-3 gap-8">
               <div className="text-center">
                  <div className="text-2xl font-black text-gray-900 leading-none mb-1">0</div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invited</p>
               </div>
               <div className="text-center">
                  <div className="text-2xl font-black text-gray-900 leading-none mb-1">0</div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
               </div>
               <div className="text-center">
                  <div className="text-2xl font-black text-lime-600 leading-none mb-1">€0</div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Earned</p>
               </div>
            </div>
          </motion.div>

          {/* How it Works / FAQ */}
          <div className="lg:col-span-2 space-y-6">
             <div className={`${premiumCard} !p-8 bg-gray-50 border-gray-100`}>
                <h4 className="text-lg font-black uppercase italic text-gray-900 mb-6 flex items-center gap-3">
                   <FaUsers className="text-[#CBFF38]" /> How it Works
                </h4>
                <div className="space-y-6">
                   {[
                     { step: "01", text: "Invite a friend using your unique link." },
                     { step: "02", text: "They book and complete their first visit." },
                     { step: "03", text: "You both get €5 added to your reward balance." }
                   ].map((s, i) => (
                     <div key={i} className="flex gap-4">
                        <span className="text-[10px] font-black text-[#CBFF38] italic shrink-0 mt-1">{s.step}</span>
                        <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase tracking-tight italic">{s.text}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-2 italic">Common Questions</h4>
                <div className="bg-white rounded-[24px] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="group">
                      <button 
                        onClick={() => toggleFAQ(idx)}
                        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-[11px] font-black uppercase italic text-gray-900">{faq.q}</span>
                        {faqOpen === idx ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                      </button>
                      <AnimatePresence>
                        {faqOpen === idx && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-4 overflow-hidden"
                          >
                             <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-tighter italic">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="mt-12 text-center">
            <Link to="/rewards" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
               View Reward Balances <FaArrowRight />
            </Link>
        </div>
      </div>
    </div>
  );
};
