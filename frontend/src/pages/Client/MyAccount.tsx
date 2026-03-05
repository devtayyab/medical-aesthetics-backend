import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { logout } from "@/store/slices/authSlice";

// Images & Icons
import { TbCalendarClock } from "react-icons/tb";
import { ImProfile } from "react-icons/im";
import { IoPersonAdd } from "react-icons/io5";
import { AiOutlineTrophy } from "react-icons/ai";
import { RiWalletLine } from "react-icons/ri";
import { MdOutlineSettings } from "react-icons/md";
import { FaBalanceScale, FaBook, FaStar } from "react-icons/fa";
import { FaGift } from "react-icons/fa6";
import { MdOutlineSupportAgent } from "react-icons/md";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
// Images
import LayeredBG from "@/assets/LayeredBg.svg";
import AvatarImg from "@/assets/Avatar.svg";

const containerStyle = css`
  display: grid;
  gap: var(--spacing-lg);
  grid-template-columns: 1fr;
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const cardStyle = css`
  min-height: 190px;
  padding: 24px 16px;
  border: 1px solid #3c3c3c4d;
  border-radius: var(--radius-lg);
  background-color: var(--color-white);
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-5px);
  }
`;

export const MyAccount: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const { appointments } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    if (isAuthenticated && !appointments.length) {
      dispatch(fetchUserAppointments());
    }
  }, [dispatch, isAuthenticated, appointments.length]);


  if (!isAuthenticated) {
    return null; // Handled by ProtectedLayout
  }

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/");
  };

  return (
    <section
      className="relative bg-cover bg-center min-h-[550px] flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${LayeredBG})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[1100px] mx-auto my-11 p-4">
        <div className="mb-14 flex items-center gap-3">
          <img src={AvatarImg} className="size-[77px]" alt="Avatar" />
          <span>
            <h2 className="text-[#222222] text-[20px] md:text-[30px] leading-10 font-bold">
              Account
            </h2>
            <p className="text-[#222222] text-[15px]">{user?.email}</p>
          </span>
          <Button onClick={handleLogout} variant="outline" className="ml-auto text-red-600 border-red-200 hover:bg-red-50 font-bold px-6">
            Log out
          </Button>
        </div>

        {/* Booking Full Width Box */}
        <Card
          className={`bg-[#FFFFFF80] w-full mb-6 flex flex-col md:flex-row min-h-[256px] ${cardStyle}`}
        >
          <div className="w-full md:w-1/2">
            <span className="flex items-center gap-3 mb-2">
              <ImProfile size={27} />
              <h2 className="text-[#222222] text-[20px] font-semibold">
                Book Your Treatment
              </h2>
            </span>
            <p className="text-[#717171] text-[18px]">
              Book your treatment With the best doctors
            </p>
          </div>
          <div className="w-full md:w-1/2">
            <span className="flex items-center gap-3 mb-2">
              <h2 className="text-[#222222] text-[20px] font-semibold">
                Book Your Treatment
              </h2>
            </span>
            <p className="text-[#717171] text-[18px]">
              Book your treatment from home with just on click with the best
              doctors in your town
            </p>
            <Link to="/search">
              <Button
                className="mt-5 text-[18px] bg-[#BBF246] hover:bg-[#a6d838] text-[#1A1A1A] rounded-[12px] border-none"
              >
                Book Now
              </Button>
            </Link>
          </div>
        </Card>

        <div className={containerStyle}>
          <Link to="/appointments">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <TbCalendarClock size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  My Appointments
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Track your upcoming visits
              </p>
            </Card>
          </Link>

          <Link to="/personal-details">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <ImProfile size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Personal Details
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Update your personal information
              </p>
            </Card>
          </Link>

          <Link to="/invite-friend">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <IoPersonAdd size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Invite a Friend, Get $5
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Share and earn rewards
              </p>
            </Card>
          </Link>

          <Link to="/rewards">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <AiOutlineTrophy size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Rewards
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                View available rewards
              </p>
            </Card>
          </Link>

          <Link to="/payments">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <RiWalletLine size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Payments
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Check your payment records
              </p>
            </Card>
          </Link>
          <Link to="/gift-card">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <FaGift size={27} className="text-[#CBFF38]" />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Gift Card
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Purchase or redeem gift cards
              </p>
            </Card>
          </Link>
          <Link to="/blog">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <FaBook size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Blog
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Read our latest beauty tips
              </p>
            </Card>
          </Link>

          <Link to="/reviews">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <FaStar size={27} className="text-yellow-400" />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Reviews
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Share your experience
              </p>
            </Card>
          </Link>
          <Link to="/settings">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <MdOutlineSettings size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Settings
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Manage your account settings
              </p>
            </Card>
          </Link>
          <a href="tel:+44123456789">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <MdOutlineSupportAgent size={27} className="text-lime-600" />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Call Support
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Speak directly with our team
              </p>
            </Card>
          </a>
        </div>

        <div className="flex flex-wrap justify-between items-center mt-[50px]">
          <div className="flex items-center flex-wrap gap-5 md:gap-8 mb-5 md:mb-0">
            <Link to="/legal" className="flex items-center gap-3 group">
              <FaBalanceScale size={18} className="text-[#717171] group-hover:text-lime-600 transition-colors" />
              <p className="text-[#717171] text-[14px] group-hover:text-black transition-colors font-medium">Legal</p>
            </Link>
            <Link to="/support" className="flex items-center gap-3 group">
              <MdOutlineSupportAgent size={18} className="text-[#717171] group-hover:text-lime-600 transition-colors" />
              <p className="text-[#717171] text-[14px] group-hover:text-black transition-colors font-medium">Customer Help Center</p>
            </Link>
            <Link to="/chat" className="flex items-center gap-3 group">
              <MdOutlineMarkUnreadChatAlt
                size={18}
                className="text-[#717171] group-hover:text-lime-600 transition-colors"
              />
              <p className="text-[#717171] text-[14px] group-hover:text-black transition-colors font-medium">Chat Support</p>
            </Link>
            <a href="tel:+44123456789" className="flex items-center gap-3 group">
              <MdOutlineSupportAgent size={18} className="text-[#717171] group-hover:text-lime-600 transition-colors" />
              <p className="text-[#717171] text-[14px] group-hover:text-black transition-colors font-medium">Call Support</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
