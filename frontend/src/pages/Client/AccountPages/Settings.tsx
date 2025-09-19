import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import AvatarImg from "@/assets/Avatar.svg";
// import { MdOutlineSettings } from "react-icons/md";

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

export const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Placeholder for settings options
  const settings = [
    { id: "1", name: "Notification Preferences", value: "On" },
    { id: "2", name: "Language", value: "English" },
  ];

  return (
    <section className={sectionStyle}>
      <div className={containerStyle}>
        <div className={breadcrumbStyle}>
          <Link to="/my-account">Account</Link> / Settings
        </div>
        <h2 className={headingStyle}>Settings</h2>
        <div className="mb-14 flex items-center gap-3">
          <img src={AvatarImg} className="size-[77px]" alt="Avatar" />
          <span>
            <p className="text-[#222222] text-[15px]">{user?.email}</p>
          </span>
        </div>
        <div>
          {settings.map((setting) => (
            <div key={setting.id} className={detailRowStyle}>
              <label className={labelStyle}>{setting.name}</label>
              <span className={valueStyle}>{setting.value}</span>
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
