import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLoyaltyReports } from "@/store/slices/clinicSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";

export const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reports, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  useEffect(() => {
    dispatch(fetchLoyaltyReports("me")); // Assume 'me' for current clinic
  }, [dispatch]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Loyalty Reports</h2>
      {reports ? (
        <div>
          <p>
            <strong>Total Points Redeemed:</strong>{" "}
            {reports.totalPointsRedeemed || 0}
          </p>
          <p>
            <strong>Active Members:</strong> {reports.activeMembers || 0}
          </p>
          <p>
            <strong>Average Points per User:</strong>{" "}
            {reports.averagePointsPerUser || 0}
          </p>
        </div>
      ) : (
        <p>No reports available.</p>
      )}
    </div>
  );
};
