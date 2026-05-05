import React from "react";
import { Card } from "@/components/atoms/Card/Card";
import type { LoyaltyBalance } from "@/types";
import { css } from "@emotion/css";
import { Star, Trophy, Gift, Zap } from "lucide-react";

interface LoyaltyCardProps {
  balance: LoyaltyBalance;
}

const cardContainer = (tier: string) => css`
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  background: ${tier.toLowerCase() === 'gold' 
    ? 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)' 
    : tier.toLowerCase() === 'silver'
    ? 'linear-gradient(135deg, #757F9A, #D7DDE8)'
    : 'linear-gradient(135deg, #232526, #414345)'};
  padding: 32px;
  color: ${tier.toLowerCase() === 'gold' || tier.toLowerCase() === 'silver' ? '#1a202c' : 'white'};
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const glassChip = css`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ balance }) => {
  const tierName = balance.tier || "Bronze";
  const points = balance.points ?? 0;

  return (
    <div className={cardContainer(tierName)}>
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
            Membership Status
          </p>
          <div className="flex items-center gap-2">
            <Trophy size={20} className={tierName.toLowerCase() === 'gold' ? 'text-yellow-700' : 'text-gray-400'} />
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">
              {tierName} Tier
            </h3>
          </div>
        </div>
        <div className={glassChip}>
          <Zap size={14} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest italic">Elite Member</span>
        </div>
      </div>

      <div className="flex justify-between items-end relative z-10 mt-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
            Available Points
          </p>
          <p className="text-5xl font-black italic tracking-tighter leading-none">
            {points.toLocaleString()}
          </p>
        </div>
        
        {balance.rewards?.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex -space-x-2">
              {balance.rewards.slice(0, 3).map((_, i) => (
                <div key={i} className="size-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center backdrop-blur-md">
                  <Gift size={14} />
                </div>
              ))}
              {balance.rewards.length > 3 && (
                <div className="size-8 rounded-full bg-black/20 border-2 border-white/30 flex items-center justify-center backdrop-blur-md text-[10px] font-bold">
                  +{balance.rewards.length - 3}
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">
              Active Rewards
            </p>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
         <Star size={120} className="rotate-12" />
      </div>
    </div>
  );
};
