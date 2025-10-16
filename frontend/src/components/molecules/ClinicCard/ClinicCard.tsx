import React from "react";
import { css } from "@emotion/css";
import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/atoms/Card/Card";
import type { Clinic } from "@/types";
import BotoxImg from "@/assets/Botox.jpg";
import { FaArrowRightLong } from "react-icons/fa6";
import MapPinIcon from "@/assets/Icons/MapPin.png";
export interface ClinicCardProps {
  clinic: Clinic;
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

const title = css`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const rating = css`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

// const location = css`
//   margin-top: 12px;
//   display: flex;
//   align-items: center;
//   gap: 4px;
//   font-size: 14px;
//   color: #221f1f;
// `;

const badge = css`
  margin-top: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #405c0b;
`;

const rowsContainer = css`
  margin-top: 12px;
  // border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
`;

const row = css`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 14px;
  color: #374151;

  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const leftText = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  span:first-of-type {
    font-weight: 600;
    color: #111827;
  }
  span:last-of-type {
    font-size: 13px;
    color: #6b7280;
  }
`;

const rightText = css`
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #111827;

  .sub {
    font-size: 12px;
    color: #2563eb;
    font-weight: 400;
    margin-top: 2px;
  }
`;

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onSelect }) => {
  const handleClick = () => {
    onSelect?.(clinic);
  };
  console.log("clinic", clinic);

  const imageUrl = [
    clinic.images?.[0] || BotoxImg,
    clinic.images?.[1] ||
    "https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400",
  ];

  // Example rows — these can be dynamic
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
          <img src={imageUrl[0]} className="w-full" alt={clinic.name} />
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








            {/* <div className={badge}>% Off peak</div> */}
          </span>


          <div className="flex flex-row justify-between ">



            <div className="flex flex-row items-center gap-2">
              <div className="">
                <img src={MapPinIcon} alt="" className="w-5 h-5" />

              </div>

              <div className="flex flex-col">
                <span className="text-[#221F1F] text-[18px] font-medium">
                  Available in:
                </span>
                <span className="text-[#555] text-[16px]">
                  {clinic.address?.city}, {clinic.address?.country}
                </span>
              </div>

            </div>
            <div>

              <span className="text-end">



                <h3 className="text-[#221F1F] text-[18px] font-medium">
                  from € 49
                </h3>
                <p className="text-sm text-sky-600">save up to 99%</p>
                <span className="w-full flex justify-end">
                  <button
                    type="submit"
                    className="!mt-5 w-fit px-6 py-2 rounded-lg font-medium text-base flex items-center justify-center gap-2 bg-[#CBFF38] text-</div>[#33373F] hover:bg-lime-300 transition"
                  >
                    Book Treatment <FaArrowRightLong />
                  </button>
                </span>
              </span>
            </div>
          </div>
        </div>
      </span>
      {/* <div className={rowsContainer}>
        {rows.map((r, idx) => (
          <div key={idx} className={row}>
            <div className={leftText}>
              <span>{r.title}</span>
              <span>{r.subtitle}</span>
            </div>
            <div className={rightText}>
              from $1
              <div className="sub">save up to 99%</div>
            </div>
          </div>
        ))}
      </div> */}
    </Card>
  );
};
