import React from "react";
import { css } from "@emotion/css";
import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/atoms/Card/Card";
import type { Clinic } from "@/types";
import BotoxImg from "@/assets/Botox.jpg";
import { FaArrowRightLong } from "react-icons/fa6";

export interface ClinicCardProps {
  clinic: Clinic;
  index?: number;
  onSelect?: (clinic: Clinic) => void;
}

const cardStyle = css`
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  padding: 18px;
  gap: 16px;
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const imageBox = css`
  width: 515px;
  height: 270px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
`;

const rightContent = css`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const location = css`
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #221f1f;
`;

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  index = 0,
  onSelect,
}) => {
  const handleClick = () => {
    onSelect?.(clinic);
  };

  const imageUrl =
    clinic.images?.[index] || clinic.images?.[0] || BotoxImg;

  // Example rows (optional)
  const rows = [
    { title: "Book now", subtitle: "15 mins" },
    {
      title: `Available in ${clinic.services?.length || 1} clinics`,
      subtitle: "15 mins",
    },
    { title: "Can’t find availability? Call the clinic", subtitle: "15 mins" },
  ];

  return (
    <Card
      className={`flex flex-col ${cardStyle}`}
      padding="none"
      variant="default"
      hoverable
      onClick={handleClick}
    >
      <span className="flex gap-6">
        <div className={imageBox}>
          <img src={imageUrl} alt={clinic.name} />
        </div>

        <div className={`py-2 justify-between ${rightContent}`}>
          <span>
            <div className="space-y-3">
              <h3 className="text-[#221F1F] text-[18px] font-semibold">
                {clinic.name}
              </h3>
              <p className="text-sm text-gray-500">{clinic.description}</p>
              {clinic.rating && (
                <div className="flex items-center gap-2 ">
                  <span className="ml-1">{clinic.rating.toFixed(1)}</span>
                  <div className="flex items-center gap-1 text-[14px] text-gray-700 font-medium">
                    {[...Array(4)].map((_, i) => (
                      <Star key={i} size={18} fill="#f59e0b" stroke="none" />
                    ))}
                    <Star size={18} fill="#D7DAE0" stroke="none" />
                    {clinic.reviewCount && (
                      <span className="ml-3 text-gray-400">
                        {clinic.reviewCount} reviews
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={location}>
              <MapPin size={14} /> {clinic.address?.city},{" "}
              {clinic.address?.country}
            </div>
          </span>

          <span className="text-end">
            <h3 className="text-[#221F1F] text-[18px] font-medium">
              from € 49
            </h3>
            <p className="text-sm text-gray-500">save up to 99%</p>
            <span className="w-full flex justify-end">
              <button
                type="submit"
                className="!mt-5 w-fit px-6 py-2 rounded-lg font-medium text-base flex items-center justify-center gap-2 bg-[#CBFF38] text-[#33373F] hover:bg-lime-300 transition"
              >
                Book Treatment <FaArrowRightLong />
              </button>
            </span>
          </span>
        </div>
      </span>
    </Card>
  );
};
