import React from "react";
import { Card } from "@/components/atoms/Card/Card";
import type { LoyaltyBalance } from "@/types";

interface LoyaltyCardProps {
  balance: LoyaltyBalance;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ balance }) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Loyalty Points</h3>
        {/* <p className="text-gray-600">Points: {balance.points}</p> */}
        <p className="text-gray-600">Points: {balance.totalPoints}</p>
        <p className="text-gray-600">Tier: {balance.tier}</p>
        {balance.rewards.length > 0 && (
          <p className="text-gray-600">Rewards: {balance.rewards.join(", ")}</p>
        )}
      </div>
    </Card>
  );
};
