import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoyaltyDashboard } from "@/components/organisms/LoyaltyDashboard";
import { fetchLoyaltyBalance } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";

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
    <>
      <h2 className="text-2xl font-bold mb-4">Loyalty Program</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {loyaltyBalance && <LoyaltyDashboard balance={loyaltyBalance} />}
    </>
  );
};
