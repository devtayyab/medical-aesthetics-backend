import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import axios from "axios";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBG.svg";
import { setTokens } from "@/store/slices/authSlice";
import { FaChevronRight } from "react-icons/fa6";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const PersonalDetails: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, accessToken, refreshToken } = useSelector(
    (state: RootState) => state.auth
  );

  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const [isEditingLastName, setIsEditingLastName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    user?.phone?.slice(0, 2) || "+1"
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phone?.slice(2) || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (field: string) => {
    const fullPhone = `${phoneCountryCode}${phoneNumber}`;
    try {
      console.log("Attempting to refresh token manually...");
      let newAccessToken = accessToken;
      const tokenToRefresh =
        refreshToken || localStorage.getItem("refreshToken");
      if (tokenToRefresh) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/refresh`,
          {
            refreshToken: tokenToRefresh,
          }
        );
        console.log("Manual refresh success, response:", response.data);
        const {
          accessToken: refreshedAccessToken,
          refreshToken: newRefreshToken,
        } = response.data;
        newAccessToken = refreshedAccessToken;
        dispatch(
          setTokens({
            accessToken: refreshedAccessToken,
            refreshToken: newRefreshToken,
          })
        );
      }

      const updateData: any = {};
      if (field === "firstName") updateData.firstName = firstName;
      if (field === "lastName") updateData.lastName = lastName;
      if (field === "phone") updateData.phone = fullPhone;

      console.log("Attempting to update profile with:", updateData);
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || "/api"}/users/me/profile`,
        updateData,
        {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        }
      );
      console.log("Update profile success, response:", response.data);

      // Reset editing states
      setIsEditingFirstName(false);
      setIsEditingLastName(false);
      setIsEditingPhone(false);
      setError(null);
    } catch (err: any) {
      console.error("Update profile error:", err.response?.data || err.message);
      let message = "Failed to update profile. Please try again.";

      // If backend sends an array of messages (like NestJS validation errors)
      if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          message = err.response.data.message.join(", ");
        } else {
          message = err.response.data.message;
        }
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
    }
  };

  const renderEditableField = (
    label: string,
    value: string,
    isEditing: boolean,
    onEdit: () => void,
    onSave: () => void,
    inputElement: React.ReactNode,
    placeholder: string = "Not set"
  ) => (
    <div
      className={`flex justify-between ${isEditing ? "flex-col" : "items-baseline"} py-6 border-b border-[#EAEAEA] last-of-type:border-none`}
    >
      <div
        className={`space-y-1 ${isEditing ? "w-full flex flex-col mb-4" : ""}`}
      >
        <label className="text-[#33373F] text-[18px] font-medium py-[1.25px]">
          {label}
        </label>
        {isEditing ? (
          inputElement
        ) : (
          <p className="text-[#586271]">{value || placeholder}</p>
        )}
      </div>
      <div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={onSave}
              className="text-[#203400] hover:!text-white bg-[#CBFF38] hover:!bg-[#7CB342] border-[#203400] hover:border-[#5F8B00] px-6 py-2 rounded-[12px] transition-colors"
            >
              Save
            </Button>
            <Button
              onClick={() => {
                if (label === "First Name") setIsEditingFirstName(false);
                if (label === "Last Name") setIsEditingLastName(false);
                if (label === "Phone") setIsEditingPhone(false);
              }}
              className="text-[#405C0B] border border-[#5F8B00] px-4 py-2 rounded-[12px] hover:bg-[#7CB342] hover:text-white transition-colors"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-[#33373F] hover:underline">
            {value ? "Edit" : "Add"}
          </button>
        )}
      </div>
    </div>
  );

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
        <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
          <Link
            to="/my-account"
            className="hover:text-[#405C0B] transition-colors"
          >
            Account
          </Link>{" "}
          <span className="px-3">
            <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
          </span>
          Personal Info
        </div>
        <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
          Personal Info
        </h2>

        <div className="">
          {/* Email (non-editable) */}
          <div className="space-y-1 py-6 border-b border-[#EAEAEA]">
            <label className="text-[#33373F] text-[18px] font-medium py-[1.25px]">
              Email
            </label>
            <p className="text-[#586271]">{user?.email}</p>
          </div>

          {/* First Name */}
          {renderEditableField(
            "First Name",
            firstName,
            isEditingFirstName,
            () => setIsEditingFirstName(true),
            () => handleSave("firstName"),
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-[12px] px-4 py-3 border border-[#D1D5DB] focus:border-[#D1E9FF] outline-none transition-all"
              placeholder="Enter your first name"
            />
          )}

          {/* Last Name */}
          {renderEditableField(
            "Last Name",
            lastName,
            isEditingLastName,
            () => setIsEditingLastName(true),
            () => handleSave("lastName"),
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-[12px] px-4 py-3 border border-[#D1D5DB] focus:border-[3px] focus:border-[#D1E9FF] outline-none transition-all"
              placeholder="Enter your last name"
            />
          )}

          {/* Phone */}
          {renderEditableField(
            "Phone",
            user?.phone || "",
            isEditingPhone,
            () => setIsEditingPhone(true),
            () => handleSave("phone"),
            <div className="flex gap-3">
              <input
                type="text"
                value={phoneCountryCode}
                onChange={(e) => {
                  let value = e.target.value;

                  // Ensure it starts with "+"
                  if (!value.startsWith("+")) {
                    value = "+" + value.replace(/\+/g, "");
                  }

                  // Allow only digits after "+"
                  value = "+" + value.slice(1).replace(/\D/g, "");

                  // Limit to + and max 2 digits
                  if (value.length > 3) {
                    value = value.slice(0, 3);
                  }

                  setPhoneCountryCode(value);
                }}
                className="w-20 rounded-[12px] px-4 py-3 border border-[#D1D5DB] focus:border-[3px] focus:border-[#D1E9FF] outline-none transition-all"
                placeholder="+92"
              />

              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 rounded-[12px] px-4 py-3 border border-[#D1D5DB] focus:border-[3px] focus:border-[#D1E9FF] outline-none transition-all"
                placeholder="Enter phone number"
              />
            </div>
          )}

          {error && (
            <div className="py-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* <div className="pt-8 flex justify-between">
            <Button
              onClick={() => navigate("/my-account")}
              className="text-[18px] text-[#586271] border-[#D1D5DB] hover:bg-gray-50 rounded-[12px] px-6 py-3"
              variant="outline"
            >
              Back to Account
            </Button>

            {(isEditingFirstName || isEditingLastName || isEditingPhone) && (
              <Button
                onClick={() => {
                  setIsEditingFirstName(false);
                  setIsEditingLastName(false);
                  setIsEditingPhone(false);
                }}
                className="text-[18px] text-[#586271] border-[#D1D5DB] hover:bg-gray-50 rounded-[12px] px-6 py-3"
                variant="outline"
              >
                Cancel All
              </Button>
            )}
          </div> */}
        </div>
      </div>
    </section>
  );
};
