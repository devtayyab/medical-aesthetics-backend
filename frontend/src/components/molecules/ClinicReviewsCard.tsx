import React from "react";
import { Star, ShieldCheck, Flag } from "lucide-react";
import { getPreferredLanguage } from "@/utils/language";

type ReviewCardProps = {
  rating: number;
  review: string;
  treatedBy: string;
  treatmentType: string;
  author: string;
  reviewId?: string;
};

const ClinicReviewCard: React.FC<ReviewCardProps> = ({
  rating,
  review,
  treatedBy,
  treatmentType,
  author,
  reviewId,
}) => {
  const isGreek = getPreferredLanguage() === "el";

  const reportSubject = encodeURIComponent(`Report Review: ${reviewId || author}`);
  const reportBody = encodeURIComponent(
    `Hello BeautyDoctors Support,\n\nI would like to report the following review for investigation:\nAuthor: ${author}\nDoctor/Clinic: ${treatedBy}\nReview text: "${review}"\n\nReason for reporting:`
  );
  const reportMailto = `mailto:info@beautydoctors.gr?subject=${reportSubject}&body=${reportBody}`;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-3 space-y-3">
      {/* Top Bar: Author, Verified Badge & Report */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900 text-sm">{author}</p>
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-700 bg-lime-50 px-2 py-0.5 rounded-full mt-1 border border-lime-200">
            <ShieldCheck size={12} className="text-lime-600 shrink-0" />
            <span>
              {isGreek
                ? "Επαληθευμένη αξιολόγηση από ραντεβού μέσω BeautyDoctors"
                : "Verified review from appointment booked through BeautyDoctors"}
            </span>
          </div>
        </div>

        {/* Report Button (Required by Law) */}
        <a
          href={reportMailto}
          title={isGreek ? "Αναφορά αξιολόγησης" : "Report review"}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
        >
          <Flag size={12} />
          <span>{isGreek ? "Αναφορά" : "Report"}</span>
        </a>
      </div>

      {/* Stars & Treatment Tag */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
              }`}
            />
          ))}
        </div>
        {treatmentType && (
          <span className="border border-gray-200 bg-gray-50 text-gray-600 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {treatmentType}
          </span>
        )}
      </div>

      {/* Review Text */}
      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">"{review}"</p>

      {/* Doctor */}
      {treatedBy && (
        <div className="text-[11px] text-gray-500 font-medium">
          <span>{isGreek ? "Θεραπεία από:" : "Treated by:"} </span>
          <span className="font-semibold text-gray-800">{treatedBy}</span>
        </div>
      )}
    </div>
  );
};

export default ClinicReviewCard;
