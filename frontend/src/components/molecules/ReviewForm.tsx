import React, { useState } from "react";
import { Star } from "lucide-react";
import { Input } from "@/components/atoms/Input/Input";
import { Button } from "@/components/atoms/Button/Button";

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && comment.trim()) {
      onSubmit(rating, comment);
      setRating(0);
      setComment("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rating
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
                className={`w-7 h-7 transition-colors ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} 
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Comment
        </label>
        <Input
          placeholder="Your review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
        />
      </div>
      <Button type="submit" disabled={rating === 0 || !comment.trim()}>
        Submit Review
      </Button>
    </form>
  );
};
