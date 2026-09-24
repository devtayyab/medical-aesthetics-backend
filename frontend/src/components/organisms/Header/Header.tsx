import React, { useState, useEffect } from"react";
import { css } from"@emotion/css";
import { Link, useNavigate, useLocation } from"react-router-dom";
import { Search, User, Bell, Menu, X, MessageCircle, ChevronLeft, ChevronRight, Phone, ChevronDown } from"lucide-react";
import { useCategoryTree } from"@/hooks/useCategoryTree";
import { useSelector, useDispatch } from"react-redux";
import { Button } from"@/components/atoms/Button/Button";
import { Input } from"@/components/atoms/Input/Input";
import type { RootState, AppDispatch } from"@/store";
import { logout } from"@/store/slices/authSlice";
import { fetchUnreadCount } from"@/store/slices/notificationsSlice";
import { publicCatalogAPI } from"@/services/api";

import SiteLogo from"@/assets/SiteLogo.png";
import { NotificationDropdown } from"@/components/molecules/NotificationDropdown";

const containerStyle = css`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 4.5rem;
  @media (max-width: 768px) {
    height: 3.75rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  margin: 0 1rem;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const mobileMenuButtonStyle = css`
  display: none;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
 padding: 0;
 display: flex;
 flex-direction: column;
 overflow-y: auto;
`;

const mobileMenuHeaderStyle = css`
 display: flex;
 justify-content: space-between;
 align-items: center;
 padding: 1rem 1.25rem;
 background-color: #0B1120;
 border-bottom: 1px solid rgba(255, 255, 255, 0.1);
 position: sticky;
 top: 0;
 z-index: 10;
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
 font-style: ;
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
  const [currentLang, setCurrentLang] = useState<'en' | 'el'>(
    (localStorage.getItem('preferredLang') as 'en' | 'el') || 'en'
  );
  const { categories: navCategories } = useCategoryTree();

  const handleLanguageSwitch = (lang: 'en' | 'el') => {
    setCurrentLang(lang);
    (window as any).switchLanguage?.(lang);
  };
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
 const clinicRoles = ["clinic_owner","doctor","secretariat"];

 // Dynamic menu items based on role
 const getMenuItems = () => {
 if (!user?.role) return [];

 if (user.role ==="admin") {
 return [
 { to:"/admin/dashboard", label:"Dashboard" },
 { to:"/messages", label:"Messages" },
 { to:"/crm/settings", label:"Settings" },
 { action: handleLogout, label:"Logout" },
 ];
 }

 if (user.role ==="SUPER_ADMIN" || user.role ==="manager") {
 return [
 { to:"/admin/manager-dashboard", label:"Dashboard" },
 { to:"/messages", label:"Messages" },
 { to:"/crm/settings", label:"Settings" },
 { action: handleLogout, label:"Logout" },
 ];
 }



 if (user.role ==="client") {
 return [
 { to:"/appointments", label:"My Appointments" },
 { to:"/my-account", label:"My Account" },
 { to:"/messages", label:"Messages" },
 { to:"/settings", label:"Settings" },
 { action: handleLogout, label:"Logout" },
 ];
 }

 if (user.role ==="doctor") {
 return [
 { to:"/clinic/diary", label:"My Appointments" },
 { to:"/crm/settings", label:"Settings" },
 { action: handleLogout, label:"Logout" },
 ];
 }

 if (user.role ==="secretariat") {
 return [
 { to:"/clinic/dashboard", label:"Dashboard" },
 { to:"/clinic/appointments", label:"Appointments" },
 { to:"/clinic/availability-settings", label:"Availability" },
 { to:"/clinic/diary", label:"Diary" },
 { to:"/messages", label:"Messages" },
 { to:"/crm/settings", label:"Settings" },
 { action: handleLogout, label:"Logout" },
 ];
 }

 if (clinicRoles.includes(user.role)) {
 return [
 { to:"/clinic/dashboard", label:"Dashboard" },
 { to:"/clinic/appointments", label:"Appointments" },
 { to:"/clinic/clients", label:"Clients" },
 { to:"/clinic/reviews", label:"Reviews" },
 { to:"/messages", label:"Messages" },
 { to:"/clinic/notifications", label:"Notifications" },
 { to:"/clinic/settings", label:"Settings" },
 { action: handleLogout, label:"Logout" },
 ];
 }

  if (user.role ==="salesperson") {
  return [
  { to:"/crm", label:"CRM" },
  { to:"/crm/customers", label:"Customers" },
  { to:"/crm/tasks", label:"Tasks" },
  { to:"/crm/repeat-management", label:"Repeat Management" },
  { to:"/crm/leads", label:"Leads" },
  { to:"/crm/lost-leads", label:"Lost Leads" },
  { to:"/messages", label:"Messages" },
  { to:"/crm/communication", label:"Communication" },
  { to:"/crm/tag", label:"Tags" },
  { to:"/crm/settings", label:"Settings" },
  { action: handleLogout, label:"Logout" },
  ];
  }

 return [{ action: handleLogout, label:"Logout" }]; // Default case
 };

 return (
 <>
 <header className="w-full bg-[#1A202C] sticky top-0 z-[999] border-b border-white/10 backdrop-blur-md">
      {/* Top Utility Bar with Phone, Email & Clinic Portal */}
      <div className="w-full border-b border-white/5 bg-black/40 text-gray-300 text-[11px] py-1.5 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-[#CBFF38]" />
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Call Us:</span>
              <a href="tel:6948880498" className="hover:text-[#CBFF38] font-bold text-white transition-colors">6948880498</a>
              <span className="text-gray-600">/</span>
              <a href="tel:2112184564" className="hover:text-[#CBFF38] font-bold text-white transition-colors">2112184564</a>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <MessageCircle className="h-3 w-3 text-[#CBFF38]" />
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Email:</span>
              <a href="mailto:info@beautydoctors.gr" className="hover:text-[#CBFF38] font-bold text-white transition-colors">
                info@beautydoctors.gr
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/for-clinics"
              className="text-[10px] font-black uppercase tracking-wider text-gray-300 hover:text-[#CBFF38] transition-colors"
            >
              For Clinics &amp; Partners &rarr;
            </Link>
          </div>
        </div>
      </div>
 <div className={containerStyle}>
 <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
 <button
 onClick={() => navigate(-1)}
 className="hidden sm:flex size-9 sm:size-10 rounded-xl text-gray-400 border border-white/10 items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all font-black shrink-0"
 title="Go Back"
 >
 <ChevronLeft size={18} />
 </button>
 <button
 onClick={() => navigate(1)}
 className="hidden sm:flex size-9 sm:size-10 rounded-xl text-gray-400 border border-white/10 items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all font-black shrink-0"
 title="Go Forward"
 >
 <ChevronRight size={18} />
 </button>
 <Link
 to={
 clinicRoles.includes(user?.role ||"") ?"/clinic/dashboard" : (user?.role ==="SUPER_ADMIN" || user?.role ==="manager") ?"/admin/manager-dashboard" :"/"
 }
 className={`flex items-center no-underline ${clinicRoles.includes(user?.role ||"") ?"justify-center" :""}`}
 >
 <div className="w-[180px] sm:w-[220px] 2xl:w-[260px] h-12 sm:h-16 relative flex items-center justify-center mr-1 sm:mr-4 transition-all">
 <img src={SiteLogo} alt="Site Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(203,255,56,0.1)] pointer-events-none" />
 </div>
 </Link>
 </div>

 {!clinicRoles.includes(user?.role || '') && (
 <>
 {user?.role !== 'salesperson' && (
 <div className={searchContainerStyle}>
 <ul className="flex justify-center items-center gap-3 lg:gap-4 xl:gap-6 2xl:gap-8 text-white whitespace-nowrap transition-all">
                {/* Treatments with Mega-Menu */}
                <li
                  className="cursor-pointer relative"
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  onMouseLeave={() => setIsCategoriesOpen(false)}
                >
                  <Link
                    to="/treatments"
                    className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                      location.pathname.startsWith("/treatments")
                        ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Treatments <ChevronDown size={12} className={`transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180 text-[#CBFF38]' : ''}`} />
                  </Link>

                  {isCategoriesOpen && navCategories.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-50 w-[720px] max-w-[90vw]">
                      <div className="bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl p-6 backdrop-blur-xl">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                          <div>
                            <h4 className="text-white text-xs font-black uppercase tracking-wider">Medical & Aesthetic Treatments</h4>
                            <p className="text-gray-400 text-[11px] mt-0.5">Explore treatments delivered by specialized medical practitioners</p>
                          </div>
                          <Link
                            to="/treatments"
                            onClick={() => setIsCategoriesOpen(false)}
                            className="text-[11px] font-black uppercase tracking-widest text-[#CBFF38] hover:underline flex items-center gap-1"
                          >
                            All Treatments &rarr;
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                          {navCategories.map((cat) => (
                            <div key={cat.id} className="space-y-2">
                              <button
                                onClick={() => {
                                  setIsCategoriesOpen(false);
                                  navigate(`/search?category=${encodeURIComponent(cat.name)}`);
                                }}
                                className="w-full text-left font-black text-xs uppercase tracking-wider text-white hover:text-[#CBFF38] transition-colors flex items-center gap-2 group"
                              >
                                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                                <span className="group-hover:translate-x-0.5 transition-transform">{cat.name}</span>
                              </button>

                              {(cat.children || []).length > 0 && (
                                <div className="flex flex-col space-y-1 pl-4 border-l border-white/10">
                                  {(cat.children || []).map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setIsCategoriesOpen(false);
                                        navigate(`/search?category=${encodeURIComponent(sub.name)}`);
                                      }}
                                      className="text-left text-[11px] text-gray-400 hover:text-white transition-colors py-0.5"
                                    >
                                      {sub.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>

                {/* Doctors / Clinics */}
                <li className="cursor-pointer">
                  <Link
                    to="/search"
                    className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                      location.pathname === "/search" && !location.search.includes("category=")
                        ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Doctors/Clinics
                  </Link>
                </li>

                {/* Privileges */}
                <li className="cursor-pointer">
                  <Link
                    to="/services"
                    className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                      location.pathname.startsWith("/services")
                        ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Privileges
                  </Link>
                </li>

                {/* Articles */}
                <li className="cursor-pointer">
                  <Link
                    to="/blog"
                    className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                      location.pathname.startsWith("/blog") || location.pathname.startsWith("/articles")
                        ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Articles
                  </Link>
                </li>

                {/* Contact */}
                <li className="cursor-pointer">
                  <Link
                    to="/contact"
                    className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all ${
                      location.pathname.startsWith("/contact")
                        ? "text-[#CBFF38] drop-shadow-[0_0_8px_rgba(203,255,56,0.3)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Contact
                  </Link>
                </li>

                {/* For Clinics */}
                <li className="cursor-pointer">
                  <Link
                    to="/for-clinics"
                    className={`text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-white/20 transition-all ${
                      location.pathname.startsWith("/for-clinics") || location.pathname.startsWith("/partners")
                        ? "bg-[#CBFF38] text-black border-[#CBFF38]"
                        : "text-gray-400 hover:text-white hover:border-white/40"
                    }`}
                  >
                    For Clinics
                  </Link>
                </li>
              </ul>
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
 {unreadCount > 9 ?"9+" : unreadCount}
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
 {unreadCount > 9 ?"9+" : unreadCount}
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
  <span className="notranslate">{(user?.firstName ||"User")}</span>
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

  {/* Language Switcher - Desktop */}
  <div className="hidden md:flex items-center rounded-xl overflow-hidden border border-white/10 bg-white/5">
  <button
  onClick={() => handleLanguageSwitch('en')}
  className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
  currentLang === 'en'
  ? 'bg-[#CBFF38] text-black'
  : 'text-gray-400 hover:text-white'
  }`}
  title="Switch to English"
  >
  EN
  </button>
  <div className="w-px h-4 bg-white/10" />
  <button
  onClick={() => handleLanguageSwitch('el')}
  className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
  currentLang === 'el'
  ? 'bg-[#CBFF38] text-black'
  : 'text-gray-400 hover:text-white'
  }`}
  title="Switch to Greek"
  >
  ΕΛ
  </button>
  </div>
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
    </header>

  {isMobileMenuOpen && (
  <div className={mobileMenuStyle}>
  <div className={mobileMenuHeaderStyle}>
  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={logoStyle}>
  <div className="w-[180px] sm:w-[200px] h-10 sm:h-12 relative flex items-center justify-start">
  <img src={SiteLogo} alt="Site Logo" className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_10px_rgba(203,255,56,0.15)]" />
  </div>
  </Link>
  <button 
  onClick={() => setIsMobileMenuOpen(false)} 
  className="size-9 rounded-xl bg-white/10 text-white hover:bg-[#CBFF38] hover:text-black transition-all flex items-center justify-center"
  >
  <X size={20} />
  </button>
  </div>

  <div className="p-4 sm:p-6 flex flex-col gap-4 flex-1 overflow-y-auto">

  {/* Universal Mobile Language Switcher (Visible to all users including SuperAdmin, Admin, Clinic, Client) */}
  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 shadow-sm">
    <span className="text-xs font-black uppercase tracking-wider text-gray-500">Language</span>
    <div className="flex items-center rounded-xl overflow-hidden border border-gray-300 bg-white shadow-xs">
      <button
        onClick={() => handleLanguageSwitch('en')}
        className={`px-4 py-2 text-[12px] font-black uppercase tracking-wider transition-all ${
          currentLang === 'en'
            ? 'bg-[#CBFF38] text-black shadow-sm'
            : 'text-gray-500 hover:text-black hover:bg-gray-50'
        }`}
      >
        EN
      </button>
      <div className="w-px h-5 bg-gray-200" />
      <button
        onClick={() => handleLanguageSwitch('el')}
        className={`px-4 py-2 text-[12px] font-black uppercase tracking-wider transition-all ${
          currentLang === 'el'
            ? 'bg-[#CBFF38] text-black shadow-sm'
            : 'text-gray-500 hover:text-black hover:bg-gray-50'
        }`}
      >
        ΕΛ
      </button>
    </div>
  </div>

  {isAuthenticated ? (
  <>
  {/* ✅ Logged-in: Show role-specific menu only */}
  <div className="flex flex-col gap-1">
  {/* User info badge */}
  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl mb-2">
  <div className="size-10 rounded-full bg-[#0B1120] flex items-center justify-center">
  <User size={18} className="text-[#CBFF38]" />
  </div>
  <div>
  <p className="text-sm font-black text-gray-900 uppercase tracking-tight notranslate">
  {user?.firstName} {user?.lastName}
  </p>
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
  {user?.role?.replace('_', ' ')}
  </p>
  </div>
  </div>

  {/* Role-specific nav links */}
  {getMenuItems().map((item, index) =>
  item.to ? (
  <Link
  key={index}
  to={item.to}
  onClick={() => setIsMobileMenuOpen(false)}
  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${
  location.pathname === item.to
  ? 'bg-[#CBFF38] text-black'
  : 'text-gray-700 hover:bg-gray-100'
  }`}
  >
  {item.label}
  </Link>
  ) : (
  <button
  key={item.label}
  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all text-left ${
  item.label === 'Logout'
  ? 'mt-2 text-red-500 hover:bg-red-50'
  : 'text-gray-700 hover:bg-gray-100'
  }`}
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
  <>
  {/* ✅ Not logged-in: Show public website links */}
  <div className="flex gap-2">
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
 </div>

 <div className="flex flex-col gap-1 mt-2">
            <Link
              to="/"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname === '/' ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/treatments"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname.startsWith('/treatments') ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Treatments
            </Link>
            <Link
              to="/search"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname === '/search' ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Doctors / Clinics
            </Link>
            <Link
              to="/services"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname.startsWith('/services') ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Privileges
            </Link>
            <Link
              to="/blog"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname.startsWith('/blog') || location.pathname.startsWith('/articles') ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Articles
            </Link>
            <Link
              to="/contact"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname.startsWith('/contact') ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/for-clinics"
              className={`flex items-center px-4 py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all ${location.pathname.startsWith('/for-clinics') ? 'bg-[#CBFF38] text-black' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              For Clinics / Partners
            </Link>
          </div>

          <div className="flex flex-col gap-2 mt-2">
 <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest px-4">Treatments</span>
 {navCategories.length > 0 ? (
 navCategories.map((cat) => {
 const hasChildren = cat.children && cat.children.length > 0;
 return (
 <div key={cat.id} className="flex flex-col gap-1 pl-2">
 {hasChildren ? (
 <>
 <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest px-4 py-1">{cat.name}</span>
 {cat.children!.map((sub) => (
 <Link key={sub.id} to={`/search?category=${encodeURIComponent(sub.name)}`} className="px-4 py-2 text-[12px] text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>↳ {sub.name}</Link>
 ))}
 </>
 ) : (
 <Link to={`/search?category=${encodeURIComponent(cat.name)}`} className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>{cat.name}</Link>
 )}
 </div>
 );
 })
 ) : (
 <div className="px-4 py-2 text-xs text-gray-500">Loading categories...</div>
 )}
 </div>
 </>
 )}
 </div>
 </div>
 )}
 </>
 );
};
