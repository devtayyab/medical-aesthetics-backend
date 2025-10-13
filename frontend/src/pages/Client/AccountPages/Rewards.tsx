import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight } from "react-icons/fa6";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
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

  const renderEditableField = (
    label: string,
    value: string | number,
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
              onClick={onEdit}
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
          Rewards
        </div>
        <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
          Rewards
        </h2>
        <div>
          {rewards.map((reward) =>
            renderEditableField(
              reward.name,
              `Requires ${reward.points} points`,
              false,
              () => { },
              () => { },
              <input
                type="text"
                value={`Requires ${reward.points} points`}
                className="w-full rounded-[12px] px-4 py-3 border border-[#D1D5DB] focus:border-[#D1E9FF] outline-none transition-all"
                disabled
              />
            )
          )}
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
