import React, { useState } from "react";
import { css } from "@emotion/css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Bell, Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";

import SiteLogo from "@/assets/SiteLogo.png";

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  @media (min-width: 768px) {
    padding: 0 var(--spacing-xl);
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

const searchContainerStyle = css`
  flex: 1;
  max-width: 400px;
  margin: 0 var(--spacing-xl);
  @media (max-width: 768px) {
    display: none;
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
        { to: "/crm", label: "CRM" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (user.role === "SUPER_ADMIN") {
      return [
        { to: "/admin/manager-dashboard", label: "Dashboard" },
        // { to: "/crm", label: "CRM" },
        { action: handleLogout, label: "Logout" },
      ];
    }



    if (user.role === "client") {
      return [
        { to: "/search", label: "Clinics" },
        { to: "/appointments", label: "My Appointments" },
        { to: "/my-account", label: "My Account" },
        { action: handleLogout, label: "Logout" },
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
    <header className="bg-[#2D3748] py-5">
      <div
        className={css`
          ${containerStyle};
          ${clinicRoles.includes(user?.role || "")
            ? "justify-content: center;"
            : ""}
        `}
      >        <Link
          to={
            clinicRoles.includes(user?.role || "") ? "/clinic/dashboard" : user?.role === "SUPER_ADMIN" ? "/admin/manager-dashboard" : "/"
          }
          className={`text-[#CBFF38] text-2xl font-bold flex items-center ${clinicRoles.includes(user?.role || "") ? "justify-center" : ""
            }`}
        >
          <img src={SiteLogo} alt="Site Logo" className="w-[200px]" />
        </Link>

        {/* Desktop Navigation for Non-Clinic Roles */}
        {!clinicRoles.includes(user?.role || "") && (
          <>
            <div className={searchContainerStyle}>
              <ul className="flex justify-center items-center gap-8 text-white font-medium whitespace-nowrap">
                {/* <li
                  className={`cursor-pointer ${location.pathname === "/"
                    ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
                    : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
                    }`}
                >
                  <Link
                    to="/"
                    className={`no-underline ${location.pathname === "/"
                      ? "text-[#CBFF38]"
                      : "text-white"
                      }`}
                  >
                    Home
                  </Link>
                </li> */}
                {(user?.role === "salesperson" || user?.role === "clinic_owner") && (
                  <li
                    className={`cursor-pointer ${location.pathname === "/crm"
                      ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
                      : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
                      }`}
                  >
                    <Link
                      to="/crm"
                      className={`no-underline ${location.pathname === "/crm"
                        ? "text-[#CBFF38]"
                        : "text-white"
                        }`}
                    >
                      CRM
                    </Link>
                  </li>
                )}
                 {clinicRoles.includes(user?.role || "") && <>
                <li
                  className={`cursor-pointer ${location.pathname.startsWith("/search")
                    ? "text-[#CBFF38] border-b-2 border-[#CBFF38]"
                    : "hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38]"
                    }`}
                >
                  <Link
                    to="/search"
                    className={`no-underline ${location.pathname.startsWith("/search")
                      ? "text-[#CBFF38]"
                      : "text-white"
                      }`}
                  >
                    Clinics
                  </Link>
                </li>
         </>}
              </ul>
            </div>

            <nav className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
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
              )}
            </nav>
          </>
        )}

        {/* Mobile Menu Button for All Roles */}
        <button
          className={mobileMenuButtonStyle}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} className="text-white" />
        </button>
      </div>

   {/* if user is not logged in , add Home , face and Body medical aesthetics , Asthetics Gynacology , Asthetics Dermatology , Asthetics Plastic Surgery , Hair Removal laser */}
   {!isAuthenticated && (
    <div className="flex items-center gap-5 justify-center mt-5">
    <Link
      to="/"
      className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
    >
     Home
    </Link>
    <Link
      to="/search?q=Face and Body Medical Aesthetics"
      className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
    >
     Face and Body Medical Aesthetics
    </Link>
    <Link
      to="/search?q=Asthetics Gynacology"
      className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
    >
     Asthetics Gynacology
    </Link>
    <Link
      to="/search?q=Asthetics Dermatology"
      className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
    >
     Asthetics Dermatology
    </Link>
    <Link
      to="/search?q=Asthetics Plastic Surgery"
      className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
    >
     Asthetics Plastic Surgery
    </Link>
    <Link
      to="/search?q=Hair Removal Laser"
      className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
    >
     Hair Removal Laser
    </Link>
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
                 
    <Link
      to="/"
      className="text-black"
    >
     Home
    </Link>
    <Link
      to="/search?q=Face and Body Medical Aesthetics"
      className="text-black"
    >
     Face and Body Medical Aesthetics
    </Link>
    <Link
      to="/search?q=Asthetics Gynacology"
      className="text-black"
    >
     Asthetics Gynacology
    </Link>
    <Link
      to="/search?q=Asthetics Dermatology"
      className="text-black"
    >
     Asthetics Dermatology
    </Link>
    <Link
      to="/search?q=Asthetics Plastic Surgery"
      className="text-black"
    >
     Asthetics Plastic Surgery
    </Link>
    <Link
      to="/search?q=Hair Removal Laser"
      className="text-black"
    >
     Hair Removal Laser
    </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
