import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Bell, Menu, X, MessageCircle, ChevronLeft, ChevronRight, Phone, ChevronDown } from "lucide-react";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { RootState, AppDispatch } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { fetchUnreadCount } from "@/store/slices/notificationsSlice";
import { publicCatalogAPI } from "@/services/api";

import SiteLogo from "@/assets/SiteLogo.png";
import { NotificationDropdown } from "@/components/molecules/NotificationDropdown";

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
  @media (max-width: 768px) {
    height: 3.5rem;
    padding: 0 0.75rem;
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
  margin: 0 1rem;
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

const notificationButtonStyle = css`
  display: flex;
  position: relative;
  padding: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #8c8c8c;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    background-color: #cbff38;
    color: black;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -10px rgba(203, 255, 56, 0.3);
    border-color: #cbff38;
  }
`;

const userMenuButtonStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
  
  &:hover {
    background-color: #cbff38;
    color: black;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -10px rgba(203, 255, 56, 0.3);
    border-color: #cbff38;
  }

  span {
    font-style: italic;
  }
`;

const navItemStyle = css`
  color: #CBD5E0;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  background-color: #2D3748;
  white-space: nowrap;
  
  &:hover {
    background-color: #CBFF38;
    color: black;
  }
`;

const activeNavItemStyle = css`
  background-color: #CBFF38;
  color: black;
`;

const userMenuDropdownStyle = css`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  min-width: 240px;
  z-index: 1001;
  padding: 12px;
  border: 1px solid #f0f0f0;
  animation: slide-down 0.2s ease-out;

  @keyframes slide-down {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const userMenuItemStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  text-decoration: none;
  color: #1a202c;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  
  &:hover {
    background-color: #f7fafc;
    color: #cbff38;
    background: #000;
  }
`;

const logoutButtonStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 8px);
  margin: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #fee2e2;
  color: #ef4444;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #ef4444;
    color: white !important;
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const { categories: navCategories } = useCategoryTree();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { unreadCount } = useSelector(
    (state: RootState) => state.notifications
  );
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
    }
  }, [isAuthenticated, dispatch]);

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
        { to: "/messages", label: "Messages" },
        { to: "/crm/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (user.role === "SUPER_ADMIN" || user.role === "manager") {
      return [
        { to: "/admin/manager-dashboard", label: "Dashboard" },
        { to: "/messages", label: "Messages" },
        { to: "/crm/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }



    if (user.role === "client") {
      return [
        { to: "/search", label: "Treatments" },
        { to: "/appointments", label: "My Appointments" },
        { to: "/my-account", label: "My Account" },
        { to: "/messages", label: "Messages" },
        { to: "/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (user.role === "doctor") {
      return [
        { to: "/clinic/diary", label: "My Appointments" },
        { to: "/crm/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (user.role === "secretariat") {
      return [
        { to: "/clinic/dashboard", label: "Dashboard" },
        { to: "/clinic/appointments", label: "Appointments" },
        { to: "/clinic/availability-settings", label: "Availability" },
        { to: "/clinic/diary", label: "Diary" },
        { to: "/messages", label: "Messages" },
        { to: "/crm/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (clinicRoles.includes(user.role)) {
      return [
        { to: "/clinic/dashboard", label: "Dashboard" },
        { to: "/clinic/appointments", label: "Appointments" },
        { to: "/clinic/clients", label: "Clients" },
        { to: "/clinic/reviews", label: "Reviews" },
        { to: "/messages", label: "Messages" },
        { to: "/clinic/notifications", label: "Notifications" },
        { to: "/clinic/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    if (user.role === "salesperson") {
      return [
        { to: "/crm", label: "CRM" },
        { to: "/crm/customers", label: "Customers" },
        { to: "/crm/tasks", label: "Tasks" },
        { to: "/crm/repeat-management", label: "Repeat Management" },
        { to: "/crm/leads", label: "Leads" },
        { to: "/messages", label: "Messages" },
        { to: "/crm/communication", label: "Communication" },
        { to: "/crm/tag", label: "Tags" },
        { to: "/crm/settings", label: "Settings" },
        { action: handleLogout, label: "Logout" },
      ];
    }

    return [{ action: handleLogout, label: "Logout" }]; // Default case
  };

  return (
    <>
      <header className="bg-[#2D3748] py-2 sm:py-3 sticky top-0 z-[999] border-b border-white/5 backdrop-blur-md">
        <div className={containerStyle}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="size-10 rounded-xl text-gray-400 border border-white/10 flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all font-black"
              title="Go Back"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigate(1)}
              className="size-10 rounded-xl text-gray-400 border border-white/10 flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all font-black"
              title="Go Forward"
            >
              <ChevronRight size={18} />
            </button>
            <Link
              to={
                clinicRoles.includes(user?.role || "") ? "/clinic/dashboard" : (user?.role === "SUPER_ADMIN" || user?.role === "manager") ? "/admin/manager-dashboard" : "/"
              }
              className={`flex items-center ml-2 no-underline ${clinicRoles.includes(user?.role || "") ? "justify-center" : ""}`}
            >
              <div className="w-[140px] sm:w-[180px] h-12 relative flex items-center justify-center mr-2 lg:mr-4">
                <img src={SiteLogo} alt="Site Logo" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] sm:w-[220px] max-w-none drop-shadow-[0_0_15px_rgba(203,255,56,0.1)] transition-all pointer-events-none" />
              </div>
            </Link>
          </div>

          {!clinicRoles.includes(user?.role || '') && (
            <>
              {user?.role !== 'salesperson' && (
                <div className={searchContainerStyle}>
                  <ul className="flex justify-center items-center gap-4 lg:gap-8 text-white whitespace-nowrap">
                    <li
                      className="cursor-pointer relative"
                      onMouseEnter={() => setIsCategoriesOpen(true)}
                      onMouseLeave={() => setIsCategoriesOpen(false)}
                    >
                      <Link
                        to="/treatments"
                        className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.15em] italic transition-all ${location.pathname.startsWith("/treatments")
                          ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                          : "text-gray-400 hover:text-white"
                          }`}
                      >
                        Categories <ChevronDown size={12} className={`transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                      </Link>

                      {isCategoriesOpen && navCategories.length > 0 && (
                        <div className="absolute left-0 top-full pt-3 z-50">
                          <div className="bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl p-4 min-w-[260px] max-h-[70vh] overflow-y-auto grid gap-1">
                            {navCategories.map((cat) => (
                              <div key={cat.id}>
                                <button
                                  onClick={() => { setIsCategoriesOpen(false); navigate(`/search?category=${encodeURIComponent(cat.name)}`); }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest italic text-white hover:bg-[#CBFF38] hover:text-black transition-all flex items-center gap-2"
                                >
                                  {cat.icon ? <span className="not-italic">{cat.icon}</span> : null}{cat.name}
                                </button>
                                {(cat.children || []).length > 0 && (
                                  <div className="pl-4 mt-0.5 mb-1 flex flex-col">
                                    {(cat.children || []).map((sub) => (
                                      <button
                                        key={sub.id}
                                        onClick={() => { setIsCategoriesOpen(false); navigate(`/search?category=${encodeURIComponent(sub.name)}`); }}
                                        className="text-left px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#CBFF38] transition-all"
                                      >
                                        ↳ {sub.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                    <li className="cursor-pointer">
                      <Link
                        to="/services"
                        className={`text-[11px] font-black uppercase tracking-[0.15em] italic transition-all ${location.pathname.startsWith("/services")
                          ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                          : "text-gray-400 hover:text-white"
                          }`}
                      >
                        Privileges
                      </Link>
                    </li>
                    <li className="cursor-pointer">
                      <Link
                        to="/blog"
                        className={`text-[11px] font-black uppercase tracking-[0.15em] italic transition-all ${location.pathname.startsWith("/blog") || location.pathname.startsWith("/articles")
                          ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                          : "text-gray-400 hover:text-white"
                          }`}
                      >
                        Articles
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              {user?.role !== 'salesperson' && (
                <div className="hidden xl:flex items-center gap-4 mr-4">
                  <div className="flex items-center gap-2">
                    <div className="size-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Call Us</span>
                      <div className="text-xs font-black text-white leading-none flex gap-1">
                        <a href="tel:6948880498" className="hover:text-[#CBFF38] transition-colors">6948880498</a>
                        <span className="text-gray-600">/</span>
                        <a href="tel:2112184564" className="hover:text-[#CBFF38] transition-colors">2112184564</a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="size-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <MessageCircle size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Email</span>
                      <a href="mailto:info@beautydoctors.gr" className="text-xs font-black text-white leading-none hover:text-[#CBFF38] transition-colors">
                        info@beautydoctors.gr
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="md:hidden relative mr-2">
                  <button
                    className={`group ${notificationButtonStyle}`}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  >
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
                  <NotificationDropdown
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                </div>
              )}

              <nav className="hidden md:flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <div className="relative">
                      <button
                        className={`group ${notificationButtonStyle}`}
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      >
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
                      <NotificationDropdown
                        isOpen={isNotificationsOpen}
                        onClose={() => setIsNotificationsOpen(false)}
                      />
                    </div>

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
                                className={item.label === 'Logout' ? logoutButtonStyle : userMenuItemStyle}
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
                    <button
                      className="text-white font-bold hover:text-[#CBFF38] transition-all uppercase text-[12px] tracking-wider whitespace-nowrap"
                      onClick={() => navigate("/login")}
                    >
                      Sign In
                    </button>
                    <Link
                      to="/register"
                      className="bg-[#A3E635] text-black px-5 py-2 rounded-lg font-black uppercase text-[12px] tracking-wider hover:bg-white hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(163,230,53,0.3)] whitespace-nowrap"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </>
          )}

          <button
            className={mobileMenuButtonStyle}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>

        {!isAuthenticated && (
          <div className="hidden md:flex items-center gap-2 justify-center mt-5 relative z-20 flex-wrap px-4">
            <Link to="/" className={`${navItemStyle} ${location.pathname === '/' ? activeNavItemStyle : ''}`}>Home</Link>
            {navCategories.length > 0 ? (
              navCategories.map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                return (
                  <div key={cat.id} className="relative group">
                    <Link
                      to={`/search?category=${encodeURIComponent(cat.name)}`}
                      className={`${navItemStyle} flex items-center gap-1.5`}
                    >
                      {cat.name}
                      {hasChildren && (
                        <ChevronDown size={12} className="opacity-60 transition-transform duration-200 group-hover:rotate-180" />
                      )}
                    </Link>

                    {/* Subcategories Dropdown */}
                    {hasChildren && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200">
                        <div className="bg-[#0B1120] border border-white/10 rounded-xl shadow-2xl p-2 min-w-[200px] flex flex-col gap-0.5">
                          {cat.children!.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/search?category=${encodeURIComponent(sub.name)}`}
                              className="text-left px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-black hover:bg-[#CBFF38] transition-all"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Fallback static links while loading
              <>
                <Link to="/search?category=hair-removal" className={navItemStyle}>Hair Removal</Link>
                <Link to="/search?category=facial-aesthetics" className={navItemStyle}>Facial Aesthetics</Link>
                <Link to="/search?category=body-aesthetics" className={navItemStyle}>Body Aesthetics</Link>
                <Link to="/search?q=Plastic Surgery" className={navItemStyle}>Plastic Surgery</Link>
              </>
            )}
          </div>
        )}
      </header>

      {isMobileMenuOpen && (
        <div className={mobileMenuStyle}>
          <div className={mobileMenuHeaderStyle}>
            <Link to="/" className={logoStyle}>
              <div className="w-[160px] h-10 relative flex items-center justify-center">
                <img src={SiteLogo} alt="Site Logo" className="w-full h-[180%] object-contain pointer-events-none" />
              </div>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} className="text-black" />
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
                className="text-black font-bold text-sm uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/blog"
                className="text-black font-bold text-sm uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Articles
              </Link>

              <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-100">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Hair Removal</span>
                <Link to="/search?q=Laser Alexandrite" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Laser Alexandrite</Link>
                <Link to="/search?q=Triple Wave Laser" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Triple Wave Laser</Link>
              </div>

              <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-100">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Facial Aesthetics</span>
                <Link to="/search?q=Botox" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Botox-Dysport</Link>
                <Link to="/search?q=Hyaluronic Acid" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Hyaluronic Acid</Link>
                <Link to="/search?q=Fractional Laser" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Fractional Laser</Link>
                <Link to="/search?q=Thread Lift" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Thread Lift (Threads)</Link>
              </div>

              <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-100">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Body Aesthetics</span>
                <Link to="/search?q=Aqualyx" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Aqualyx (Lipolysis)</Link>
                <Link to="/search?q=Cryolipolysis" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Cryolipolysis</Link>
                <Link to="/search?q=Mesotherapy" className="text-black pl-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Mesotherapy</Link>
              </div>

              <Link
                to="/search?q=Clinical Dermatology"
                className="text-black font-bold text-sm uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Clinical Dermatology
              </Link>
              <Link
                to="/search?q=Plastic Surgery"
                className="text-black font-bold text-sm uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Plastic Surgery
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};
