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
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  @media (min-width: 768px) {
    padding: 0 2rem;
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
  @media (max-width: 1024px) {
    display: none;
  }
`;

const mobileMenuButtonStyle = css`
  display: none;
  @media (max-width: 1024px) {
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
  z-index: 9999;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
`;

const mobileMenuHeaderStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
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
  z-index: 50;
  padding: var(--spacing-sm);
`;

const userMenuItemStyle = css`
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  &:hover {
    background-color: #f7fafc;
    color: #2d3748;
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
  const clinicRoles = ["clinic_owner", "doctor", "secretariat"];

  // Dynamic menu items based on role
  const getMenuItems = () => {
    if (!user?.role) return [];

    if (user.role === "admin") {
      return [
        { to: "/admin/dashboard", label: "Dashboard" },
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
        { to: "/search", label: "Treatments" },
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

    // { path: "/crm/customers", label: "Customers", icon: <Users className="w-5 h-5" /> },
    // { path: "/crm/tasks", label: "Tasks", icon: <ListChecks className="w-5 h-5" /> },
    // { path: "/crm/actions", label: "Actions", icon: <Repeat className="w-5 h-5" /> },
    // { path: "/crm/repeat-management", label: "Repeat Management", icon: <Repeat className="w-5 h-5" /> },

    if (user.role === "salesperson") {
      return [
        { to: "/crm", label: "CRM" },
        { to: "/crm/customers", label: "Customers" },
        { to: "/crm/tasks", label: "Tasks" },
        { to: "/crm/actions", label: "Actions" },
        { to: "/crm/repeat-management", label: "Repeat Management" },
        { to: "/crm/leads", label: "Leads" },
        { to: "/crm/communication", label: "Communication" },
        { to: "/crm/analytics", label: "Analytics" },
        { to: "/crm/tag", label: "Tags" },
        { to: "/crm/facebook-integration", label: "Facebook Integration" },

        { action: handleLogout, label: "Logout" },
      ];
    }

    return [{ action: handleLogout, label: "Logout" }]; // Default case
  };

  return (
    <header className="bg-[#2D3748] py-3 sm:py-5 sticky top-0 z-50">
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
          <img src={SiteLogo} alt="Site Logo" className="w-[140px] sm:w-[200px]" />
        </Link>

        {/* Desktop Navigation for Non-Clinic Roles */}
        {!clinicRoles.includes(user?.role || '') && (user?.role !== 'salesperson') && (
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
                {/* {(user?.role === "salesperson") && (
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
                )} */}
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
                      Treatments
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
        <div className="hidden md:flex items-center gap-5 justify-center mt-5 relative z-10">
          <Link
            to="/"
            className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
          >
            Home
          </Link>

          {/* Medical Aesthetics – Face & Body with Dropdown */}
          <div className="relative group">
            <button className="text-white rounded bg-[#2D3748] group-hover:bg-[#CBFF38] group-hover:text-black px-3 py-1 flex items-center gap-1 cursor-pointer">
              Medical Aesthetics – Face & Body
            </button>
            <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded shadow-lg overflow-hidden hidden group-hover:block border border-gray-200">
              <Link
                to="/search?q=Face Medical Aesthetics"
                className="block px-4 py-2 text-gray-800 hover:bg-[#CBFF38] hover:text-black"
              >
                Face
              </Link>
              <Link
                to="/search?q=Body Medical Aesthetics"
                className="block px-4 py-2 text-gray-800 hover:bg-[#CBFF38] hover:text-black"
              >
                Body
              </Link>
            </div>
          </div>

          <Link
            to="/search?q=Aesthetic %26 Reconstructive Gynecology"
            className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
          >
            Aesthetic & Reconstructive Gynecology
          </Link>
          <Link
            to="/search?q=Clinical Dermatology"
            className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
          >
            Clinical Dermatology
          </Link>
          <Link
            to="/search?q=Plastic Surgery"
            className="text-white rounded bg-[#2D3748] hover:bg-[#CBFF38] hover:text-black px-3 py-1"
          >
            Plastic Surgery
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
                      Treatments
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
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>

              <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-100">
                <span className="text-gray-500 font-medium text-sm">Medical Aesthetics – Face & Body</span>
                <Link
                  to="/search?q=Face Medical Aesthetics"
                  className="text-black pl-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Face
                </Link>
                <Link
                  to="/search?q=Body Medical Aesthetics"
                  className="text-black pl-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Body
                </Link>
              </div>

              <Link
                to="/search?q=Aesthetic %26 Reconstructive Gynecology"
                className="text-black"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Aesthetic & Reconstructive Gynecology
              </Link>
              <Link
                to="/search?q=Clinical Dermatology"
                className="text-black"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Clinical Dermatology
              </Link>
              <Link
                to="/search?q=Plastic Surgery"
                className="text-black"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Plastic Surgery
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
