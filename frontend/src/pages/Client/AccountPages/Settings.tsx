import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import { FaChevronRight } from "react-icons/fa6";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    inspirationOffers: {
      sms: false,
      email: false,
      push: true,
    },
    accountActivity: {
      sms: true,
      email: true,
    },
    customSuggestions: {
      suggestion: true,
    },
  });

  const handleCheckbox = (section: keyof typeof settings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
  };

  const handleSubmit = () => {
    console.log("Updated settings:", settings);
    // API call to save preferences here
  };

  return (
    <section
      className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={containerStyle}>
        {/* Breadcrumb */}
        <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
          <Link
            to="/my-account"
            className="hover:text-[#405C0B] transition-colors"
          >
            Account
          </Link>
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          Settings
        </div>

        {/* Title */}
        <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
          Settings
        </h2>

        {/* Sections */}
        <div className="space-y-10 text-[#33373F]">
          {/* Inspiration and offers */}
          <div>
            <h3 className="font-semibold text-[20px] mb-2">
              Inspiration and offers
            </h3>
            <p className="text-[#586271] text-[14px] mb-4">
              Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
              habitasse sit fusce lobortis scelerisque purus.
            </p>
            <div className="space-y-3">
              <label className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={settings.inspirationOffers.sms}
                  onChange={() => handleCheckbox("inspirationOffers", "sms")}
                />
                Communication via SMS
              </label>
              <label className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={settings.inspirationOffers.email}
                  onChange={() => handleCheckbox("inspirationOffers", "email")}
                />
                Communication via Email
              </label>
              <label className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={settings.inspirationOffers.push}
                  onChange={() => handleCheckbox("inspirationOffers", "push")}
                />
                Communication via Push notifications
              </label>
            </div>
          </div>

          {/* Account activity */}
          <div>
            <h3 className="font-semibold text-[20px] mb-2">
              Account activity and reminders
            </h3>
            <p className="text-[#586271] text-[14px] mb-4">
              Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
              habitasse sit fusce lobortis scelerisque purus.
            </p>
            <div className="space-y-3">
              <label className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={settings.accountActivity.sms}
                  onChange={() => handleCheckbox("accountActivity", "sms")}
                />
                Communication via SMS
              </label>
              <label className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={settings.accountActivity.email}
                  onChange={() => handleCheckbox("accountActivity", "email")}
                />
                Communication via Email
              </label>
            </div>
          </div>

          {/* Custom suggestions */}
          <div>
            <h3 className="font-semibold text-[20px] mb-2">
              Custom suggestions
            </h3>
            <div className="space-y-3">
              <label className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={settings.customSuggestions.suggestion}
                  onChange={() =>
                    handleCheckbox("customSuggestions", "suggestion")
                  }
                />
                Lorem ipsum dolor sit amet consectetur. Ut hendrerit pulvinar
                sit ac nisl.
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-10">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-[12px] bg-[#CBFF38] text-[#203400] font-medium hover:bg-[#A7E52F]"
          >
            Submit
          </button>
          <button
            onClick={() => navigate("/delete-account")}
            className="px-6 py-2 rounded-[12px] bg-[#FF3347] text-white font-medium hover:bg-[#D92B3C]"
          >
            Delete Account
          </button>
        </div>
      </div>
    </section>
  );
};
