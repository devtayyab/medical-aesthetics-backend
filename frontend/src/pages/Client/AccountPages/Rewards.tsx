import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import AvatarImg from "@/assets/Avatar.svg";
// import { AiOutlineTrophy } from "react-icons/ai";

const sectionStyle = css`
  min-height: 550px;
  background: url(${LayeredBG}) no-repeat center center;
  background-size: cover;
  padding: 20px 0;
`;

const containerStyle = css`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
`;

const breadcrumbStyle = css`
  color: #717171;
  font-size: 14px;
  margin-bottom: 10px;
`;

const headingStyle = css`
  color: #222222;
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const detailRowStyle = css`
  margin-bottom: 15px;
`;

const labelStyle = css`
  color: #717171;
  font-size: 16px;
`;

const valueStyle = css`
  color: #222222;
  font-size: 18px;
`;

export const Rewards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Placeholder for rewards data
  const rewards = [
    { id: "1", name: "10% Discount", points: 100 },
    { id: "2", name: "Free Consultation", points: 200 },
  ];

  return (
    <section className={sectionStyle}>
      <div className={containerStyle}>
        <div className={breadcrumbStyle}>
          <Link to="/my-account">Account</Link> / Rewards
        </div>
        <h2 className={headingStyle}>Rewards</h2>
        <div className="mb-14 flex items-center gap-3">
          <img src={AvatarImg} className="size-[77px]" alt="Avatar" />
          <span>
            <p className="text-[#222222] text-[15px]">{user?.email}</p>
          </span>
        </div>
        <div>
          {rewards.map((reward) => (
            <div key={reward.id} className={detailRowStyle}>
              <label className={labelStyle}>{reward.name}</label>
              <span className={valueStyle}>
                Requires {reward.points} points
              </span>
            </div>
          ))}
          <Button
            onClick={() => navigate("/my-account")}
            className="mt-5 text-[18px] text-[#FF3347] border-[#FF3347] hover:border-transparent rounded-[12px]"
            variant="outline"
          >
            Back to Account
          </Button>
        </div>
      </div>
    </section>
  );
};
