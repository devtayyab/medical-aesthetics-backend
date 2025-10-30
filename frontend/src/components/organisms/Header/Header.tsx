import React, { useState } from "react";
import { css } from "@emotion/css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Bell, Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { IoMdArrowDropdown } from "react-icons/io";

import SiteLogo from "@/assets/SiteLogo.png";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

const containerStyle = css`
  width: 100%;
  max-width: 1440px;
  height: auto; 
  padding: 18px 8%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    padding: 16px 5%;
  }

  @media (max-width: 768px) {
     flex-direction: column; 
    padding: 10px 20px;
    flex-wrap: wrap;
  }

  @media (max-width: 500px) {    
    flex-direction: column;
    flex-wrap: wrap;
    align-items: flex-start;
    padding: 8px 16px;
  }
`;

const searchContainerStyle = css`
  width: 100%;
  max-width: 1440px;
  display: flex;
  align-items:center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 16px 8%;
  gap: 12px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 12px 20px;
    justify-content: flex-start;

    ul {
      flex-direction: column; /* mobile: one by one */
      gap: 10px;
      align-items: flex-start;
}
   
  }
`;




const logoStyle = css`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
  text-decoration: none;
  letter-spacing: -0.025em;
  &:hover {
    color: var(--color-primary-dark);
  }
`;


const mobileMenuButtonStyle = css`
  display: none;
  @media (max-width: 768px) {
    display: flex;
  }
`;

const mobileMenuStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-white);
  z-index: var(--z-modal);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const mobileMenuHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-gray-200);
`;

const userMenuStyle = css`
  position: relative;
  display: inline-block;
`;

const userMenuButtonStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: none;
  
  background: none;
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
  color: white;
  font-weight: var(--font-weight-medium);
  &:hover {
    background-color: #cbff38;
    color: black;
  }
`;

const userMenuDropdownStyle = css`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--color-white);
  border: 1px solid var(--color-medical-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 200px;
  z-index: var(--z-dropdown);
  padding: var(--spacing-sm);
`;

const userMenuItemStyle = css`
  display: block;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  text-decoration: none;
  color: var(--color-medical-text);
  font-weight: var(--font-weight-medium);
  &:hover {
    background-color: var(--color-medical-bg);
  }
`;

const notificationButtonStyle = css`
  display: flex;
  position: relative;
  padding: var(--spacing-sm);
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
  color: var(--color-medical-text);
  &:hover {
    background-color: #cbff38;
    color: black;
  }
`;

const notificationBadgeStyle = css`
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--color-error);
  color: var(--color-white);
  border-radius: var(--radius-full);
  width: 18px;
  height: 18px;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-medium);
`;

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, refreshToken } = useSelector(
    (state: RootState) => state.auth
  );
  
  const { unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );
  const location = useLocation();
  const {i18n}=useTranslation();
  const changeLanguage=(lang:string)=>{
    i18n.changeLanguage(lang);

  }

  console.log("Header - user:", user);
  console.log("Header - isAuthenticated:", isAuthenticated);
  console.log(
    "Header - refreshToken:",
    refreshToken ? `${refreshToken.substring(0, 20)}...` : "null"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await dispatch(logout());
    navigate("/");
  };

  // Define clinic roles
  const clinicRoles = ["clinic_owner", "doctor", "secretariat", "salesperson"];

  // Dynamic menu items based on role
  const getMenuItems = () => {
    if (!user?.role) return [];

    if (user.role === "admin") {
      return [
        { to: "/admin/dashboard", label: "Dashboard" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (user.role === "client") {
      return [
        { to: "/search", label: "Clinics" },
        { to: "/appointments", label: "My Appointments" },
        { to: "/my-account", label: "My Account" },
        { action: handleLogout, label: "Logout" },
        { to: "/crm", label: "CRM" },
      ];
    }

    if (clinicRoles.includes(user.role)) {
      return [
        { to: "/clinic/dashboard", label: "Dashboard" },
        { to: "/clinic/appointments", label: "Appointments" },
        { to: "/clinic/clients", label: "Clients" },
        { to: "/clinic/services", label: "Services" },
        { to: "/clinic/analytics", label: "Analytics" },
        { to: "/clinic/reviews", label: "Reviews" },
        { to: "/clinic/notifications", label: "Notifications" },
        { to: "/clinic/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    return [{ action: handleLogout, label: "Logout" }]; // Default case
  };

  return (
    <header className="bg-[#2D3748] ">
      {/* <div
        className={css`
          ${containerStyle};
          ${clinicRoles.includes(user?.role || "")
            ? "justify-content: center;"
            : ""}
        `}
      > */}
{/*         
        <Link
          to={
            clinicRoles.includes(user?.role || "") ? "/clinic/dashboard" : "/"
          }
          className={`text-[#CBFF38] text-2xl font-bold flex items-center ${clinicRoles.includes(user?.role || "") ? "justify-center" : ""
            }`}
          className={`text-[#CBFF38] text-2xl font-bold flex   items-center ${
            clinicRoles.includes(user?.role || "") ? "justify-center" : ""
          }`}
        > */}
        <div className={css`
          ${containerStyle}`}> 
          <img src={SiteLogo} alt="Site Logo" className="w-[200px] " />
          
                     <div className="flex  gap-[24px] items-center">
<div className=" flex  items-center w-auto h-auto  text-[#FFFFFF] font-poppins font-normal px-4 text-[14px] gap-2 leading-[24px] tracking-[0px] ">
           <h2>English</h2> 
      <IoMdArrowDropdown  />
              <Link to="/"  className="font-poppins font-normal  text-[#FFFFFF]
                 text-[14px] leading-[20px] tracking-[2%]">For Your Business</Link>
               <Button className="w-auto h-auto bg-[#CBFF38]  py-2 px-6  gap-[5.4px] rounded-[12px] border-[0.45px] opacity-100 text-black"
              onClick={() => navigate("/login")}>Login</Button> 
      {/* </Link> */}
      </div>
          </div>
          </div>
        
        
     
       
          <>
            {/* <nav className="hidden md:flex items-center gap-4"> */}
              {/* {isAuthenticated ? (
                <>
                  <button className={`group ${notificationButtonStyle}`}>
                    <Bell
                      size={20}
                      className="text-white group-hover:text-black"
                    />
                    {unreadCount > 0 && (
                      <span className={notificationBadgeStyle}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <div className={userMenuStyle}>
                    <button
                      className={userMenuButtonStyle}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <User size={20} />
                      <span>{(user?.firstName || "User").split(" ")[0]}</span>
                    </button>

                    {isUserMenuOpen && (
                      <div className={userMenuDropdownStyle}>
                        {getMenuItems().map((item, index) =>
                          item.to ? (
                            <Link
                              key={index}
                              to={item.to}
                              className={userMenuItemStyle}
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              key={item.label}
                              className={userMenuItemStyle}
                              onClick={() => {
                                item.action();
                                setIsUserMenuOpen(false);
                              }}
                            >
                              {item.label}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </>
               ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-white hover:text-black"
                    onClick={() => navigate("/login")}
                  >
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/register")}>Sign Up</Button>
                </> 
          
            )} */}
            {/* <div className="flex  gap-[24px] items-center">
<div className=" flex  items-center w-auto h-auto  text-[#FFFFFF] font-poppins font-normal px-4 text-[14px] gap-2 leading-[24px] tracking-[0px] ">
           <h2>English</h2> 
      <IoMdArrowDropdown  />
      </div>
              <Link to="/"  className="font-poppins font-normal  text-[#FFFFFF]
                 text-[14px] leading-[20px] tracking-[2%]">For Your Business</Link>
               <Button className="w-auto h-auto bg-[#CBFF38]  py-2 px-6  gap-[5.4px] rounded-[12px] border-[0.45px] opacity-100 text-black"
              onClick={() => navigate("/login")}>Login</Button> 
              </div>
            </nav> */}
           </> 
       
        {/* Mobile Menu Button for All Roles */}
        <button
          className={mobileMenuButtonStyle}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} className="text-white" />
        </button>
     
      
        {/* Desktop Navigation for Non-Clinic Roles */}
    
              {!clinicRoles.includes(user?.role || "") && location.pathname === "/" && (
  <div className={searchContainerStyle}>
    <ul className="flex flex-wrap gap-10 w-auto text-white font-normal">
      <li
        className={`cursor-pointer ${
          location.pathname === "/"
            ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
            : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
        }`}
      >
        <Link
          to="/"
          className={`no-underline font-poppins font-normal text-[14px] leading-[20px] tracking-[2%] ${
            location.pathname === "/"
              ? "text-[#CBFF38]"
              : "text-[#F5F6F7]"
          }`}
        >
          Home
        </Link>
      </li>

      <li>
        <Link
          to="/search"
          className={`no-underline font-poppins font-normal text-[14px] leading-[20px] tracking-[2%] ${
            location.pathname.startsWith("/search")
              ? "text-[#CBFF38]"
              : "text-[#F5F6F7]"
          }`}
        >
          Face And Body Medical Aesthetic
        </Link>
      </li>

      <li
        className={`cursor-pointer ${
          location.pathname.startsWith("/search")
            ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
            : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
        }`}
      >
        <Link
          to="/search"
          className={`no-underline font-poppins font-normal text-[14px] leading-[20px] tracking-[2%] ${
            location.pathname.startsWith("/search")
              ? "text-[#CBFF38]"
              : "text-[#F5F6F7]"
          }`}
        >
          Aesthetic Gynecology
        </Link>
      </li>

      <li
        className={`cursor-pointer ${
          location.pathname.startsWith("/search")
            ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
            : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
        }`}
      >
        <Link
          to="/search"
          className={`no-underline font-poppins font-normal text-[14px] leading-[20px] tracking-[2%] ${
            location.pathname.startsWith("/search")
              ? "text-[#CBFF38]"
              : "text-[#F5F6F7]"
          }`}
        >
          Prosthetic Dentistry
        </Link>
      </li>

      <li
        className={`cursor-pointer ${
          location.pathname.startsWith("/search")
            ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
            : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
        }`}
      >
        <Link
          to="/search"
          className={`no-underline font-poppins font-normal text-[14px] leading-[20px] tracking-[2%] ${
            location.pathname.startsWith("/search")
              ? "text-[#CBFF38]"
              : "text-[#F5F6F7]"
          }`}
        >
          Plastic Surgery
        </Link>
      </li>

      <li
        className={`cursor-pointer ${
          location.pathname.startsWith("/search")
            ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
            : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
        }`}
      >
        <Link
          to="/search"
          className={`no-underline font-poppins font-normal text-[14px] leading-[20px] tracking-[2%] ${
            location.pathname.startsWith("/search")
              ? "text-[#CBFF38]"
              : "text-[#F5F6F7]"
          }`}
        >
          Hair Removal-Laser
        </Link>
      </li>
    </ul>
  </div>
)}            
             

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={mobileMenuStyle}>
          <div className={mobileMenuHeaderStyle}>
            <Link to="/" className={logoStyle}>
              <img src={SiteLogo} alt="Site Logo" className="w-[200px]" />
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {isAuthenticated ? (
            <>
              <form onSubmit={handleSearch}>
                <Input
                  placeholder="Search treatments, clinics..."
                  leftIcon={<Search size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                />
              </form>
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: var(--spacing-md);
                `}
              >
                {/* Common Links for Non-Clinic Roles */}
                {!clinicRoles.includes(user?.role || "") && (
                  <>
                    <Link
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      Home
                    </Link>
                    <Link
                      to="/search"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      Clinics
                    </Link>

                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      How It Works
                    </button>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      Features
                    </button>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      Support
                    </button>
                  </>
                )}
                {/* Role-Based Menu Items */}
                {getMenuItems().map((item, index) =>
                  item.to ? (
                    <Link
                      key={index}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      className={userMenuItemStyle}
                      onClick={() => {
                        item.action();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </div>
            </>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
              `}
            >
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign In
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  navigate("/register");
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign Up
              </Button>
            </div>
          )}
          
        </div>
      )}
   
    </header>
  )
};

