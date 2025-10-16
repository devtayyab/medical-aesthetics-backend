import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/atoms/Button/Button";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight, FaGift } from "react-icons/fa6";
import { MdDiscount } from "react-icons/md";
import { BiSolidDiscount } from "react-icons/bi";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const Wallet: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [giftCard, setGiftCard] = React.useState("");
  const handleAddGiftCard = () => {
    if (!giftCard) return;
    console.log("Adding gift card:", giftCard);
    // TODO: Call API to add gift card
    setGiftCard("");
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
          Wallet
        </div>

        {/* Title */}
        <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
          Wallet
        </h2>

        {/* Add Gift Card Section */}
        <div className="py-6">
          <h3 className="text-xl font-semibold text-[#33373F] mb-2">
            Add a Gift Card
          </h3>
          <p className="text-[#586271] mb-4">
            Lorem ipsum dolor sit amet consectetur. Tincidunt viverra et dui
            habitasse sit fusce lobortis scelerisque purus. Sit cursus proin
            adipiscing risus turpis vel lacus. Pellentesque amet suspendisse
            turpis dui et massa cras morbi sit.
          </p>

          <div className="flex gap-3">
            <div className="flex items-center flex-1 bg-white border border-[#D1D5DB] rounded-[12px] pl-4 focus-within:border-[#D1E9FF]">
              <BiSolidDiscount size={22} className="text-[#586271] pt-0.5 mr-2" />
              <input
                type="text"
                placeholder="Enter gift card"
                value={giftCard}
                onChange={(e) => setGiftCard(e.target.value)}
                className="flex-1 outline-none text-[#33373F] bg-white py-3 rounded-[12px]"
              />
            </div>
            <Button
              onClick={handleAddGiftCard}
              className="bg-[#CBFF38] hover:bg-[#7CB342] text-[#203400] rounded-[12px] px-6 py-3"
            >
              Add it
            </Button>
          </div>
        </div>

        {/* Promo Codes Section */}
        <div className="text-center py-10 border-t border-[#EAEAEA]">
          <div className="flex justify-center mb-6">
            <MdDiscount className="text-6xl text-[#FF3347]" />
          </div>
          <h3 className="text-lg font-semibold text-[#33373F] mb-2">
            No promo codes at the moment
          </h3>
          <p className="text-[#586271]">
            It looks like you have used all your promo codes
          </p>
        </div>
      </div>
    </section>
  );
};
