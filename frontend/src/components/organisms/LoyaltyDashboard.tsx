import React from "react";
import { LoyaltyCard } from "@/components/molecules/LoyaltyCard";
import type { LoyaltyBalance } from "@/types";

interface LoyaltyDashboardProps {
  balance: LoyaltyBalance;
}

export const LoyaltyDashboard: React.FC<LoyaltyDashboardProps> = ({
  balance,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Loyalty Dashboard</h2>
      <LoyaltyCard balance={balance} />
    </div>
  );
};
