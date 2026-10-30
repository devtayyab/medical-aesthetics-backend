import React, { useState } from "react";
import { Star, Info } from "lucide-react";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";
import { getPreferredLanguage } from "@/utils/language";

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [consentName, setConsentName] = useState(false);

  const isGreek = getPreferredLanguage() === "el";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim() && consentName) {
      onSubmit(rating, comment);
      setRating(0);
      setComment("");
      setConsentName(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Lawyer notice: no health information */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs leading-relaxed">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p>
          {isGreek
            ? "Γράψτε την εμπειρία σας. Μην αναφέρετε στοιχεία υγείας, δικά σας ή άλλων."
            : "Describe your experience. Do not mention health information, whether your own or anyone else's."}
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
          {isGreek ? "Βαθμολογία" : "Rating"}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-all hover:scale-110 active:scale-95 px-0.5"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
          {isGreek ? "Σχόλιο" : "Comment"}
        </label>
        <Input
          placeholder={isGreek ? "Γράψτε την αξιολόγησή σας..." : "Your review..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
        />
      </div>

      {/* Mandatory publication consent checkbox */}
      <div className="flex items-start gap-2.5 pt-1">
        <input
          id="review-consent"
          type="checkbox"
          checked={consentName}
          onChange={(e) => setConsentName(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500 cursor-pointer"
        />
        <label
          htmlFor="review-consent"
          className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none"
        >
          <span className="font-bold text-gray-900">
            {isGreek ? "(υποχρεωτικό για δημοσίευση) " : "(required for publication) "}
          </span>
          {isGreek
            ? "Συμφωνώ να δημοσιευτεί η αξιολόγησή μου με το μικρό όνομα και το αρχικό του επώνυμου μου. Μπορώ να τη διαγράψω οποτεδήποτε."
            : "I agree that my review will be published with my first name and surname initial. I can delete it at any time."}
        </label>
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || !comment.trim() || !consentName}
      >
        {isGreek ? "Υποβολή Αξιολόγησης" : "Submit Review"}
      </Button>
    </form>
  );
};
