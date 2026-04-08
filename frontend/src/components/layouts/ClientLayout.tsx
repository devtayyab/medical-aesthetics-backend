import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { css } from '@emotion/css';
import { 
  TbCalendarClock, 
  TbSettings, 
  TbReceipt2, 
  TbHome 
} from "react-icons/tb";
import { ImProfile } from "react-icons/im";
import { AiOutlineTrophy } from "react-icons/ai";
import { HiOutlineGift } from "react-icons/hi2";
import { FaStar, FaBookOpen } from "react-icons/fa";
import { IoPersonAddOutline } from "react-icons/io5";

const navContainer = css`
  background: white;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 4rem; /* Below the main header */
  z-index: 40;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const navContent = css`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  padding: 0 1rem;
  gap: 2rem;
  height: 4rem;
  align-items: center;
`;

const navItem = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: #1e293b;
  }

  &.active {
    color: #000;
    border-bottom-color: #cbff38;
  }
`;

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || user?.role !== 'client') {
    return <>{children}</>;
  }

  const menuItems = [
    { title: "Home", icon: <TbHome size={18} />, link: "/" },
    { title: "My Appointments", icon: <TbCalendarClock size={18} />, link: "/appointments" },
    { title: "Personal Details", icon: <ImProfile size={18} />, link: "/personal-details" },
    { title: "Payments", icon: <TbReceipt2 size={18} />, link: "/payments" },
    { title: "Gift Cards", icon: <HiOutlineGift size={18} />, link: "/gift-card" },
    { title: "Invite & Earn", icon: <IoPersonAddOutline size={18} />, link: "/invite-friend" },
    { title: "Rewards", icon: <AiOutlineTrophy size={18} />, link: "/rewards" },
    { title: "My Reviews", icon: <FaStar size={16} />, link: "/reviews" },
    { title: "Blog", icon: <FaBookOpen size={16} />, link: "/blog" },
    { title: "Settings", icon: <TbSettings size={18} />, link: "/settings" },
    { title: "My Account", icon: <TbHome size={18} />, link: "/my-account" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className={navContainer}>
        <div className={navContent}>
          {menuItems.map((item) => (
            <NavLink
              key={item.link}
              to={item.link}
              className={({ isActive }) => `${navItem} ${isActive ? 'active' : ''}`}
              end={item.link === "/"}
            >
              <span className="text-[#CBFF38]">{item.icon}</span>
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <main>
        {children}
      </main>
    </div>
  );
};

export default ClientLayout;
