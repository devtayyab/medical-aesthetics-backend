import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import { userAPI } from "@/services/api";
import type { RootState, AppDispatch } from "@/store";
import type { Appointment } from "@/types";
import { css } from "@emotion/css";
import { logout } from "@/store/slices/authSlice";

// Images & Icons
import { TbCalendarClock } from "react-icons/tb";
import { ImProfile } from "react-icons/im";
import { IoPersonAdd } from "react-icons/io5";
import { AiOutlineTrophy } from "react-icons/ai";
import { RiWalletLine } from "react-icons/ri";
import { MdOutlineSettings } from "react-icons/md";
import { FaBalanceScale } from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";
import { MdOutlineMarkUnreadChatAlt } from "react-icons/md";
// Images
import LayeredBG from "@/assets/LayeredBg.svg";
import AvatarImg from "@/assets/Avatar.svg";
import { CheckCircle } from "lucide-react";

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
  const { appointments, isLoading, error } = useSelector(
    (state: RootState) => state.client
  );

  useEffect(() => {
    if (isAuthenticated && !appointments.length) {
      dispatch(fetchUserAppointments());
    }
  }, [dispatch, isAuthenticated, appointments.length]);

  const handleUpdateProfile = () => {
    navigate("/update-profile"); // Placeholder route for profile update
  };

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

          <Link to="/wallet">
            <Card className={`bg-[#FFFFFF80] ${cardStyle}`}>
              <span className="flex items-center gap-3 mb-2">
                <RiWalletLine size={27} />
                <h2 className="text-[#222222] text-[20px] font-semibold">
                  Wallet
                </h2>
              </span>
              <p className="text-[#717171] text-[18px]">
                Check your wallet balance
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
        </div>

        <div className="flex flex-wrap justify-between items-center mt-[50px]">
          <div className="flex items-center flex-wrap gap-5 md:gap-8 mb-5 md:mb-0">
            <span className="flex items-center gap-3">
              <FaBalanceScale size={18} className="text-[#717171]" />
              <p className="text-[#717171] text-[14px]">Legal</p>
            </span>
            <span className="flex items-center gap-3">
              <MdOutlineSupportAgent size={18} className="text-[#717171]" />
              <p className="text-[#717171] text-[14px]">Customer Help Center</p>
            </span>
            <span className="flex items-center gap-3">
              <MdOutlineMarkUnreadChatAlt
                size={18}
                className="text-[#717171]"
              />
              <p className="text-[#717171] text-[14px]">Chat Support</p>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
