import React from "react";
import { ReviewForm } from "@/components/molecules/ReviewForm";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Reviews: React.FC = () => {
  const handleSubmitReview = (rating: number, comment: string) => {
    // Dispatch submitReview action (not implemented in slices yet)
  };

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">Submit a Review</h2>
        <ReviewForm onSubmit={handleSubmitReview} />
      </div>
    </div>
  );
};
