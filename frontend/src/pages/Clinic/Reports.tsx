import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLoyaltyReports } from "@/store/slices/clinicSlice";
import type { RootState, AppDispatch } from "@/store";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reports, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  useEffect(() => {
    dispatch(fetchLoyaltyReports("self"));
  }, [dispatch]);

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Loyalty Reports</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {reports && (
          <div>
            <p>Loyalty Data: {JSON.stringify(reports)}</p>
          </div>
        )}
      </div>
    </div>
  );
};
