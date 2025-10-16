import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviewStatistics } from "@/store/slices/clinicSlice";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";

export const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reviewStats, isLoading, error } = useSelector(
    (state: RootState) => state.clinic
  );

  useEffect(() => {
    dispatch(fetchReviewStatistics());
  }, [dispatch]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Review Statistics</h2>
      {reviewStats ? (
        <div>
          <p>
            <strong>Average Rating:</strong>{" "}
            {reviewStats.averageRating?.toFixed(2) || 0}
          </p>
          <p>
            <strong>Total Reviews:</strong> {reviewStats?.totalReviews || 0}
          </p>
          <p>
            <strong>5 Star Reviews:</strong> {reviewStats?.distribution?.[5] || 0}
          </p>
        </div>
      ) : (
        <p>No statistics available.</p>
      )}
    </div>
  );
};
