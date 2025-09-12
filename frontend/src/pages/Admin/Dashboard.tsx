import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DashboardOverview } from "@/components/organisms/DashboardOverview";
import { fetchMetrics } from "@/store/slices/adminSlice";
import type { RootState, AppDispatch } from "@/store";

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { metrics, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );

  useEffect(() => {
    dispatch(fetchMetrics());
  }, [dispatch]);

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <DashboardOverview metrics={metrics} />
    </>
  );
};
