import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import { userAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import { restoreSession } from "@/store/slices/authSlice";

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const labelStyle = css`
  color: #717171;
  font-size: 16px;
`;

const valueStyle = css`
  color: #222222;
  font-size: 18px;
  margin-right: 10px;
`;

const editButtonStyle = css`
  color: #405c0b;
  border: 1px solid #5f8b00;
  padding: 5px 15px;
  border-radius: 12px;
  cursor: pointer;
  &:hover {
    background-color: #5f8b00;
    color: white;
  }
`;

const inputStyle = css`
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
`;

const phoneContainerStyle = css`
  display: flex;
  gap: 10px;
`;

export const PersonalDetails: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    user?.phone?.slice(0, 2) || "+1"
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.slice(2) || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const fullPhone = `${phoneCountryCode}${phoneNumber}`;
    try {
      console.log("Attempting to refresh token manually...");
      const state = store.getState();
      const refreshToken =
        state.auth.refreshToken || localStorage.getItem("refreshToken");
      if (refreshToken) {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        console.log("Manual refresh success, response:", response.data);
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        store.dispatch(
          setTokens({ accessToken, refreshToken: newRefreshToken })
        );
      }
      console.log("Attempting to update profile with:", {
        firstName,
        phone: fullPhone,
      });
      await userAPI.updateProfile({ firstName, phone: fullPhone });
      setIsEditingFirstName(false);
      setIsEditingPhone(false);
      navigate("/my-account");
    } catch (err: any) {
      console.error("Update profile error:", err.response?.data || err.message);
      setError(
        "Failed to update profile. Please ensure you are logged in and try again."
      );
    }
  };

  return (
    <section
      className="relative bg-cover bg-center min-h-[550px] flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className={containerStyle}>
        <div className={breadcrumbStyle}>
          <Link to="/my-account">Account</Link> &gt; Personal Details
        </div>
        <h2 className={headingStyle}>Personal Details</h2>
        <div>
          <div className="space-y-1 my-6">
            <label htmlFor="email" className="text-[#33373F]">
              Email
            </label>
            <p className="text-[#586271] text-[14px]">{user?.email}</p>
          </div>
          <div className={detailRowStyle}>
            <div>
              <label className={labelStyle}>First Name</label>
              {isEditingFirstName ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputStyle}
                />
              ) : (
                <span className={valueStyle}>{firstName || "Not set"}</span>
              )}
            </div>
            <div>
              {isEditingFirstName ? (
                <Button
                  onClick={handleSave}
                  className="text-[18px] text-[#405C0B] border-[#5F8B00] hover:border-transparent rounded-[12px]"
                  variant="outline"
                >
                  Save
                </Button>
              ) : (
                <button
                  onClick={() => setIsEditingFirstName(true)}
                  className={editButtonStyle}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className={detailRowStyle}>
            <div>
              <label className={labelStyle}>Phone</label>
              {isEditingPhone ? (
                <div className={phoneContainerStyle}>
                  <input
                    type="text"
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className={inputStyle}
                    style={{ width: "80px" }}
                  />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={inputStyle}
                    style={{ width: "120px" }}
                  />
                </div>
              ) : (
                <span className={valueStyle}>{user?.phone || "Not set"}</span>
              )}
            </div>
            <div>
              {isEditingPhone ? (
                <Button
                  onClick={handleSave}
                  className="text-[18px] text-[#405C0B] border-[#5F8B00] hover:border-transparent rounded-[12px]"
                  variant="outline"
                >
                  Save
                </Button>
              ) : (
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className={editButtonStyle}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
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
