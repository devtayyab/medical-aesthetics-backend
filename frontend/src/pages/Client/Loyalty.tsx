import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoyaltyDashboard } from "@/components/organisms/LoyaltyDashboard";
import { fetchLoyaltyBalance } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Loyalty: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loyaltyBalance, isLoading, error } = useSelector(
    (state: RootState) => state.client
  );
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchLoyaltyBalance(user.id));
    }
  }, [dispatch, user]);

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Loyalty Program</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {loyaltyBalance && <LoyaltyDashboard balance={loyaltyBalance} />}
      </div>
    </div>
  );
};
