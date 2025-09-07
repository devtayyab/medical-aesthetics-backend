import React, { useState } from "react";
import { css } from "@emotion/css";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Bell, Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";

const headerStyle = css`
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-medical-border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-sm);
`;

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

const navStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

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
  color: var(--color-medical-text);
  font-weight: var(--font-weight-medium);

  &:hover {
    background-color: var(--color-medical-bg);
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
    background-color: var(--color-medical-bg);
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

  const { isAuthenticated, user, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  console.log("user", user);
  const { unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
    navigate("/");
  };

  return (
    <header className={headerStyle}>
      <div className={containerStyle}>
        <Link to="/" className={logoStyle}>
          MedAesthetics
        </Link>

        <div className={searchContainerStyle}>
          <form onSubmit={handleSearch}>
            <Input
              placeholder="Search treatments, clinics..."
              leftIcon={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </form>
        </div>

        <nav className={navStyle}>
          {isAuthenticated && user ? (
            <>
              <button className={notificationButtonStyle}>
                <Bell size={20} />
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
                  <span>{user.firstName || "User"}</span>
                </button>

                {isUserMenuOpen && (
                  <div className={userMenuDropdownStyle}>
                    <Link
                      to="/dashboard"
                      className={userMenuItemStyle}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/appointments"
                      className={userMenuItemStyle}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Appointments
                    </Link>
                    <Link
                      to="/profile"
                      className={userMenuItemStyle}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
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
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/register")}>Sign Up</Button>
                </>
              )}
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
              MedAesthetics
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSearch}>
            <Input
              placeholder="Search treatments, clinics..."
              leftIcon={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </form>

          {isAuthenticated && user ? (
            <div>
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link
                to="/appointments"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Appointments
              </Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                Profile
              </Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate('/register');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
