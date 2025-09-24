import React from "react";

type ReviewCardProps =
{
  rating: number;
  review: string;
  treatedBy: string;
  treatmentType: string;
  author: string;
}

const ClinicReviewCard: React.FC<ReviewCardProps> = ({
  rating,
  review,
  treatedBy,
  treatmentType,
  author,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      {/* Stars */}
      <div className="flex mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-yellow-400 ${
              i < rating ? "opacity-100" : "opacity-30"
            }`}
          >
            ★
          </span>
        ))}
      </div>

      {/* Review Text */}
      <p className="text-gray-700 italic mb-3">"{review}"</p>

      {/* Doctor + Treatment */}
      <div className="flex flex-row items-center gap-2 text-sm text-gray-600 mb-2">
        <span>Treated by {treatedBy}</span>
        <span className="border rounded-full px-3 py-1 text-xs">
          {treatmentType}
        </span>
      </div>

      {/* Author */}
      <p className="font-semibold">{author}</p>
    </div>
  );
};

export default ClinicReviewCard;
