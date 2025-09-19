import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import AvatarImg from "@/assets/Avatar.svg";
// import { IoPersonAdd } from "react-icons/io5";

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

export const InviteFriend: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Placeholder for invite link
  const inviteLink = "https://example.com/invite?ref=" + user?.id;

  return (
    <section className={sectionStyle}>
      <div className={containerStyle}>
        <div className={breadcrumbStyle}>
          <Link to="/my-account">Account</Link> / Invite Friend
        </div>
        <h2 className={headingStyle}>Invite a Friend, Get $5</h2>
        <div className="mb-14 flex items-center gap-3">
          <img src={AvatarImg} className="size-[77px]" alt="Avatar" />
          <span>
            <p className="text-[#222222] text-[15px]">{user?.email}</p>
          </span>
        </div>
        <div>
          <div className={detailRowStyle}>
            <label className={labelStyle}>Invite Link</label>
            <span className={valueStyle}>{inviteLink}</span>
          </div>
          <Button
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="mt-5 text-[18px] text-[#405C0B] border-[#5F8B00] hover:border-transparent rounded-[12px]"
            variant="outline"
          >
            Copy Link
          </Button>
          <Button
            onClick={() => navigate("/my-account")}
            className="mt-2 text-[18px] text-[#FF3347] border-[#FF3347] hover:border-transparent rounded-[12px]"
            variant="outline"
          >
            Back to Account
          </Button>
        </div>
      </div>
    </section>
  );
};
