import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState } from "@/store";
import { css } from "@emotion/css";
import { ChevronRight, Trophy, Star, Lock, Gift, RotateCw, Sparkles, ArrowRight, CheckCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loyaltyAPI } from "@/services/api";
import { toast } from "react-hot-toast";

// Use the ultra-premium elite aesthetic hero image
import HeroBg from "@/assets/Elite_Aesthetic_Hero.png";

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

const pointCard = css`
  background: #000000;
  border-radius: 32px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  color: white;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15);
`;

export const Rewards: React.FC = () => {
  // ... (keep state and logic same)
  const { user } = useSelector((state: RootState) => state.auth);
  const [userPoints, setUserPoints] = useState<number>((user as any)?.points || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await loyaltyAPI.getBalance(user.id);
      setUserPoints(res.data.totalPoints || 0);
    } catch (err) {
      console.error("Failed to fetch loyalty balance", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user?.id]);

  const handleRedeem = async (reward: any) => {
    if (!user?.id) return;
    if (userPoints < reward.points) {
      toast.error("Insufficient points");
      return;
    }

    const confirm = window.confirm(`Redeem ${reward.points} points for ${reward.name}?`);
    if (!confirm) return;

    try {
      setIsRedeeming(reward.id);
      await loyaltyAPI.redeemPoints({
        clientId: user.id,
        clinicId: "",
        points: reward.points,
        description: `Redeemed for ${reward.name}`
      });
      
      toast.success(`${reward.name} redeemed successfully!`);
      await fetchBalance();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Redemption failed");
    } finally {
      setIsRedeeming(null);
    }
  };

  const nextTierPoints = 500;
  const progressPercent = Math.min((userPoints / nextTierPoints) * 100, 100);

  const rewards = [
    { id: "1", name: "10% Discount", desc: "Injectable coverage", points: 100, icon: <Gift size={20} />, color: "bg-[#CBFF38]/10 text-black" },
    { id: "2", name: "Skin Analysis", desc: "Expert assessment", points: 250, icon: <Sparkles size={20} />, color: "bg-[#CBFF38]/10 text-black" },
    { id: "3", name: "Filler Upgrade", desc: "Next-tier product", points: 500, icon: <Trophy size={20} />, color: "bg-[#CBFF38]/10 text-black" },
    { id: "4", name: "VIP Access", desc: "Priority booking", points: 1000, icon: <Lock size={20} />, color: "bg-[#CBFF38]/10 text-black" },
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
            alt="Rewards Hero" 
          />
        </div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
              <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
              <ChevronRight size={10} className="text-lime-500" />
              <span className="text-lime-500">LOYALTY PROGRAM</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
              REWARDS & <span className="text-[#CBFF38]">BENEFITS</span>
            </h1>
            
            <p className="text-gray-500 mt-4 font-bold text-base max-w-md leading-relaxed italic">
              Experience the rewards of excellence. Earn points with every session to unlock complimentary treatments.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 relative z-20 -mt-[170px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-20">
          
          {/* Points Overview Dashboard */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${pointCard} lg:col-span-2 flex flex-col justify-between`}
          >
            <div>
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Point Balance</span>
                    <h2 className="text-5xl font-black italic mt-2 tracking-tighter leading-none">{userPoints}</h2>
                    <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-2 italic opacity-60">Loyalty Excellence</p>
                 </div>
                 <button 
                  onClick={fetchBalance}
                  className={`size-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 ${isLoading ? 'animate-spin text-[#CBFF38]' : 'text-white'}`}
                 >
                   <RotateCw size={18} />
                 </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest italic">Membership Tier</span>
                    <span className="text-[9px] font-black uppercase text-[#CBFF38] tracking-widest leading-none">{Math.max(0, 500 - userPoints)} left</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      key={userPoints}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full bg-[#CBFF38]"
                    />
                  </div>
                  
                  <div className="absolute right-0 bottom-0 opacity-5 p-2">
                     <Trophy size={60} />
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#CBFF38] text-black h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-lime-400 transition-all mt-8 flex items-center justify-center gap-2">
              Earn Guide <ChevronRight size={14} />
            </button>
          </motion.div>

          {/* Rewards Grid */}
          <div className="lg:col-span-3 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black uppercase italic text-gray-900 leading-none">Catalog</h3>
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest italic leading-none">{userPoints} pts available</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {rewards.map((reward, idx) => {
                 const isLocked = userPoints < reward.points;
                 const redeemingThis = isRedeeming === reward.id;
                 return (
                    <motion.div 
                      key={reward.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${glassCard} p-6 flex flex-col justify-between group h-[220px] ${isLocked ? 'opacity-60 bg-gray-50/50' : 'hover:border-[#CBFF38] shadow-sm transition-all'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center ${reward.color} shadow-sm group-hover:bg-[#CBFF38] transition-colors`}>
                            {reward.icon}
                          </div>
                          {isLocked ? <Lock size={12} className="text-gray-300" /> : <CheckCircle size={12} className="text-[#CBFF38]" />}
                        </div>
                        <h4 className="text-lg font-black uppercase italic text-gray-900 leading-tight mb-1">{reward.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">{reward.desc}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-lime-600">Points</span>
                            <span className="text-xs font-black text-gray-900 italic">{reward.points}</span>
                         </div>
                         {!isLocked && (
                           <button 
                            disabled={!!isRedeeming}
                            onClick={() => handleRedeem(reward)}
                            className="bg-black text-[#CBFF38] px-4 h-9 rounded-xl text-[9px] font-black uppercase italic tracking-widest hover:bg-gray-800 transition-all"
                           >
                            {redeemingThis ? "Redeeming..." : "Redeem"}
                           </button>
                         )}
                      </div>
                    </motion.div>
                 );
               })}
             </div>

              <div className={`${glassCard} p-6 border-dashed border-2 border-gray-100 bg-transparent flex items-center justify-between group hover:border-[#CBFF38] transition-all`}>
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#CBFF38] transition-colors">
                      <Plus size={16} />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic group-hover:text-gray-900 transition-colors">Partnerships Launching Soon</p>
                </div>
                <ArrowRight size={14} className="text-gray-200 group-hover:text-black" />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
