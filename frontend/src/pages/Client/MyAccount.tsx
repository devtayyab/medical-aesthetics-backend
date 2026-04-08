import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { logout } from "@/store/slices/authSlice";

// Icons
import { TbCalendarClock, TbSettings, TbReceipt2 } from "react-icons/tb";
import { ImProfile } from "react-icons/im";
import { IoPersonAddOutline } from "react-icons/io5";
import { AiOutlineTrophy, AiOutlineHeart } from "react-icons/ai";
import { RiWallet3Line, RiLogoutCircleRLine } from "react-icons/ri";
import { FaBalanceScale, FaBookOpen, FaStar, FaArrowRight } from "react-icons/fa";
import { HiOutlineGift } from "react-icons/hi2";
import { MdOutlineSupportAgent, MdOutlineMarkUnreadChatAlt } from "react-icons/md";

// Assets
import LayeredBG from "@/assets/LayeredBg.svg";

const sectionStyles = css`
  min-height: 100vh;
  background: #F8F9FA;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(203, 255, 56, 0.03) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const glassHeader = css`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 50;
`;

const dashboardCard = css`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 24px;
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;

  &:hover {
    border-color: #CBFF38;
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.05);
    transform: translateY(-4px);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 60px;
    height: 60px;
    background: rgba(203, 255, 56, 0.1);
    border-radius: 50%;
    filter: blur(20px);
    transition: all 0.3s ease;
  }

  &:hover::after {
    background: rgba(203, 255, 56, 0.2);
    width: 100px;
    height: 100px;
  }
`;

const iconWrapper = (bgColor: string) => css`
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${bgColor};
  color: #1A1A1A;
  margin-bottom: 24px;
  transition: all 0.3s ease;
`;

export const MyAccount: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { appointments } = useSelector((state: RootState) => state.client);

  useEffect(() => {
    if (isAuthenticated && !appointments.length) {
      dispatch(fetchUserAppointments());
    }
  }, [dispatch, isAuthenticated, appointments.length]);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/");
  };

  const menuItems = [
    {
      title: "My Appointments",
      desc: "Track and manage your upcoming visits",
      icon: <TbCalendarClock size={24} />,
      link: "/appointments",
      bg: "#F0F9FF"
    },
    {
      title: "Personal Details",
      desc: "Update your profile and contact info",
      icon: <ImProfile size={22} />,
      link: "/personal-details",
      bg: "#F5F3FF"
    },
    {
      title: "Payments & Invoices",
      desc: "View records and download receipts",
      icon: <TbReceipt2 size={24} />,
      link: "/payments",
      bg: "#ECFDF5"
    },
    {
      title: "Gift Cards",
      desc: "Surprise someone with a treatment",
      icon: <HiOutlineGift size={24} />,
      link: "/gift-card",
      bg: "#FFFBEB"
    },
    {
      title: "Invite a Friend",
      desc: "Share the love and earn €5 rewards",
      icon: <IoPersonAddOutline size={24} />,
      link: "/invite-friend",
      bg: "#FEF2F2"
    },
    {
      title: "Rewards & Points",
      desc: "Unlock exclusive member benefits",
      icon: <AiOutlineTrophy size={24} />,
      link: "/rewards",
      bg: "#FFF7ED"
    },
    {
      title: "My Reviews",
      desc: "Share your professional experience",
      icon: <FaStar size={20} className="text-yellow-500" />,
      link: "/reviews",
      bg: "#F8FAFC"
    },
    {
      title: "Blog & Education",
      desc: "Learn about the latest beauty trends",
      icon: <FaBookOpen size={20} />,
      link: "/blog",
      bg: "#F0FDF4"
    },
    {
      title: "Account Settings",
      desc: "Manage security and notifications",
      icon: <TbSettings size={24} />,
      link: "/settings",
      bg: "#F1F5F9"
    }
  ];

  const userInitial = user?.firstName?.[0] || user?.email?.[0] || 'U';

  return (
    <section className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-28 md:pt-24 md:pb-48 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="size-14 md:size-20 rounded-2xl md:rounded-3xl bg-[#CBFF38] text-black flex items-center justify-center text-xl md:text-3xl font-black italic shadow-[0_0_40px_rgba(203,255,56,0.2)]">
              {userInitial.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-tight mb-1">
                Hello, {user?.firstName || 'Usman'}
              </h1>
              <p className="text-gray-400 font-medium tracking-wide uppercase text-[10px] md:text-xs flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#CBFF38]" />
                {user?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-3 px-5 py-2.5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] md:text-sm font-black uppercase tracking-widest"
          >
            <RiLogoutCircleRLine className="text-[#CBFF38] group-hover:rotate-12 transition-transform" size={18} />
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 md:-mt-32">
        {/* Main CTA */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden mb-8 md:mb-12 group">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
            <div className="max-w-md">
              <span className="inline-block px-3 py-1 rounded-full bg-[#CBFF38]/10 text-[#5F8B00] text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4">
                Recommended for you
              </span>
              <h1 className="text-2xl md:text-4xl font-black uppercase italic text-gray-900 leading-tight mb-3 md:mb-4 tracking-tighter">
                Treat Your Self <br className="hidden md:block"/>To Excellence
              </h1>
              <p className="text-xs md:text-gray-500 font-medium mb-6 md:mb-8 leading-relaxed max-w-[280px] md:max-w-full">
                Book your next treatment with the world's leading aesthetic professionals in just a few clicks.
              </p>
              <Link to="/search" className="w-full md:w-auto">
                <Button className="w-full md:w-auto h-12 md:h-14 px-8 md:px-10 bg-[#1A1A1A] hover:bg-black text-[#CBFF38] text-[11px] md:text-sm font-black uppercase tracking-widest rounded-xl md:rounded-2xl flex items-center justify-center gap-3 md:gap-4 group/btn">
                  Book Now
                  <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="relative hidden lg:block">
               <div className="size-64 rounded-[40px] bg-gray-100 flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="text-6xl font-black text-gray-200">B&D</div>
               </div>
               <div className="absolute -bottom-6 -left-6 size-32 rounded-3xl bg-[#CBFF38] flex items-center justify-center shadow-xl rotate-[-6deg] group-hover:rotate-0 transition-transform duration-500">
                  <AiOutlineHeart size={48} className="text-black" />
               </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/5 to-transparent pointer-events-none" />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, idx) => (
            <Link to={item.link} key={idx}>
              <div className={dashboardCard}>
                <div className={iconWrapper(item.bg)}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-black uppercase italic text-gray-900 mb-2 leading-tight tracking-tight">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Links */}
        <div className="mt-24 pt-12 border-t border-gray-200">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8">
            <div className="flex items-center gap-8 flex-wrap justify-center">
              <Link to="/support" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors">Help Center</Link>
              <Link to="/legal" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors">Terms of Use</Link>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
              © 2026 Beauty & Doctors
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
