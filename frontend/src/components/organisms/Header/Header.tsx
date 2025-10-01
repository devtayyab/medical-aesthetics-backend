import React, { useState } from "react";
import { css } from "@emotion/css";
import { Link, useNavigate } from "react-router-dom";
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
  // color: white;
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

// const navStyle = css`
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   @media (max-width: 768px) {
//     display: none;
//   }
// `;

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
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await dispatch(logout());
    navigate("/");
  };

  return (
    <header className="bg-[#2D3748] py-5">
      <div className={containerStyle}>
        <Link
          to="/"
          className="text-[#CBFF38] text-2xl font-bold flex items-center"
        >
          <img src={SiteLogo} alt="Site Logo" className="w-[200px]" />
        </Link>

        <div className={searchContainerStyle}>
          {/* <form onSubmit={handleSearch}>
            <Input
              placeholder="Search treatments, clinics..."
              leftIcon={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </form> */}
          <ul className="flex justify-center items-center gap-8 text-white font-medium whitespace-nowrap">
            <li className="text-[#CBFF38] border-b-2 border-[#CBFF38] cursor-pointer">
              <Link to="/" className="no-underline text-[#CBFF38]">
                Home
              </Link>
            </li>
            <li className="hover:text-[#CBFF38] hover:border-b-2 border-[#CBFF38] cursor-pointer">
              <Link
                to="/search"
                className="no-underline text-white hover:text-[#CBFF38]"
              >
                Clinics
              </Link>
            </li>
            <li className="hover:text-[#CBFF38] cursor-pointer">
              How It Works
            </li>
            <li className="hover:text-[#CBFF38] cursor-pointer">Features</li>
            <li className="hover:text-[#CBFF38] cursor-pointer">Support</li>
          </ul>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <button className={`group ${notificationButtonStyle}`}>
                <Bell size={20} className="text-white group-hover:text-black" />
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
                  <span>
                    {(user?.firstName || "User")
                      .split(" ")
                      .slice(0, 1)
                      .join(" ")}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className={userMenuDropdownStyle}>
                    {user?.role === "admin" ? (
                      <Link
                        to="/admin/dashboard"
                        className={userMenuItemStyle}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/search"
                          className={userMenuItemStyle}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Clinics
                        </Link>
                        <Link
                          to="/appointments"
                          className={userMenuItemStyle}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Appointments
                        </Link>
                      </>
                    )}
                    <Link
                      to="/my-account"
                      className={userMenuItemStyle}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      className={userMenuItemStyle}
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
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

        <button
          className={mobileMenuButtonStyle}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

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
                {user?.role === "admin" ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={userMenuItemStyle}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/search"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      Clinics
                    </Link>
                    <Link
                      to="/appointments"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={userMenuItemStyle}
                    >
                      My Appointments
                    </Link>
                  </>
                )}
                <Link
                  to="/my-account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={userMenuItemStyle}
                >
                  My Account
                </Link>
                <button onClick={handleLogout} className={userMenuItemStyle}>
                  Logout
                </button>
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
  );
};
