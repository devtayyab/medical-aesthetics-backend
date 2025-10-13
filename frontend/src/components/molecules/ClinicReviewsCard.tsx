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

    <div className="bg-white p-4 rounded-lg  mb-2 ">

      {/* Author */}
      <p className="font-semibold mb-2">{author}</p>

      <div className="flex flex-row items-center gap-2 text-sm text-gray-600 mb-2">

       <span className="border border-gray-500 rounded-full px-3 py-1 text-xs">
          {treatmentType} 
        </span>
        </div>
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
      <p className="text-gray-700 italic mb-2">"{review}"</p>

     

      


       {/* Doctor + Treatment */}
      <div className="flex flex-row items-center gap-2 text-sm text-gray-600 mb-2">
        <span>Treated by {treatedBy}</span>
       
      </div>
    </div>
  );
};

export default ClinicReviewCard;
