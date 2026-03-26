import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState } from "@/store";
import { css } from "@emotion/css";
import { FaChevronRight, FaTrophy, FaStar, FaLock, FaGift } from "react-icons/fa6";
import { motion } from "framer-motion";

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

export const Rewards: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userPoints = (user as any)?.points || 125;
  const nextTierPoints = 500;
  const progressPercent = Math.min((userPoints / nextTierPoints) * 100, 100);

  const rewards = [
    { id: "1", name: "10% Discount", desc: "Valid on any injectable treatment", points: 100, icon: <FaGift />, color: "bg-blue-50 text-blue-600" },
    { id: "2", name: "Free Consultation", desc: "Expert skin analysis worth £50", points: 250, icon: <FaStar />, color: "bg-amber-50 text-amber-600" },
    { id: "3", name: "Dermal Filler Upgrade", desc: "Next tier product for same price", points: 500, icon: <FaTrophy />, color: "bg-purple-50 text-purple-600" },
    { id: "4", name: "VIP Priority Access", desc: "First to book new treatments", points: 1000, icon: <FaLock />, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
            <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
            <FaChevronRight size={10} />
            <span>Loyalty Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">
            Rewards & Benefits
          </h1>
          <p className="text-gray-400 mt-2 font-medium max-w-lg">
            Earn points with every visit and unlock exclusive tier benefits and complimentary treatments.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Points Overview Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${premiumCard} lg:col-span-1 bg-black text-white border-black`}
          >
            <div className="mb-8">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38] italic">Current Balance</span>
               <h2 className="text-6xl font-black italic mt-2">{userPoints}</h2>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Reward Points</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase text-gray-400">Next Level: Silver</span>
                  <span className="text-[10px] font-black uppercase text-[#CBFF38]">{nextTierPoints - userPoints} left</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-[#CBFF38] shadow-[0_0_15px_rgba(203,255,56,0.5)]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-bold uppercase italic">
                  Complete 2 more visits to unlock silver membership status.
                </p>
              </div>

              <Button className="w-full bg-[#CBFF38] text-black h-12 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-400">
                How to Earn
              </Button>
            </div>
          </motion.div>

          {/* Rewards Grid */}
          <div className="lg:col-span-2 space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase italic text-gray-900 leading-none">Available Rewards</h3>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Based on {userPoints} points</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {rewards.map((reward, idx) => {
                 const isLocked = userPoints < reward.points;
                 return (
                    <motion.div 
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${premiumCard} !p-6 flex flex-col justify-between group cursor-pointer ${isLocked ? 'opacity-70 grayscale' : 'hover:border-lime-300'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`size-12 rounded-[18px] flex items-center justify-center text-xl shadow-sm ${reward.color}`}>
                            {reward.icon}
                          </div>
                          {isLocked && <FaLock className="text-gray-300" size={14} />}
                        </div>
                        <h4 className="text-lg font-black uppercase italic text-gray-900 leading-tight mb-2">{reward.name}</h4>
                        <p className="text-xs text-gray-400 font-bold leading-relaxed">{reward.desc}</p>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-widest text-lime-600">{reward.points} Points</span>
                         {isLocked ? (
                           <div className="text-[10px] font-black uppercase italic text-gray-400">Locked</div>
                         ) : (
                           <button className="text-[10px] font-black uppercase italic text-black hover:text-[#CBFF38] transition-colors">Redeem →</button>
                         )}
                      </div>
                    </motion.div>
                 );
               })}
             </div>

             {/* Partner/History Placeholder */}
              <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 italic text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">More rewards coming soon from our aesthetics partners.</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
