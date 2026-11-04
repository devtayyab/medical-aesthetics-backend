import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getMenuItemsForRole } from '../../utils/rolePermissions';
import { logout } from"@/store/slices/authSlice";
import { fetchClinicProfile, fetchMyClinics, fetchAppointments, fetchServices } from '@/store/slices/clinicSlice';
import { ChevronDown, Building2 } from 'lucide-react';
import {
 LayoutDashboard,
 Calendar,
 Users,
 Package,
 BarChart3,
 Star,
 Bell,
 Settings,
 LogOut,
 Clock,
 Menu,
 X,
 MessageSquare,
 BookOpen,
 UserCog,
 FileText,
 Phone,
} from 'lucide-react';
import { fetchUnreadCount } from '@/store/slices/notificationsSlice';

const iconMap: Record<string, React.ReactNode> = {
 LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
 Calendar: <Calendar className="w-5 h-5" />,
 Users: <Users className="w-5 h-5" />,
 Package: <Package className="w-5 h-5" />,
 BarChart3: <BarChart3 className="w-5 h-5" />,
 Star: <Star className="w-5 h-5" />,
 Bell: <Bell className="w-5 h-5" />,
 Settings: <Settings className="w-5 h-5" />,
 Clock: <Clock className="w-5 h-5" />,
 MessageSquare: <MessageSquare className="w-5 h-5" />,
 BookOpen: <BookOpen className="w-5 h-5" />,
 UserCog: <UserCog className="w-5 h-5" />,
 FileText: <FileText className="w-5 h-5" />,
 Phone: <Phone className="w-5 h-5" />,
};

const ClinicLayout: React.FC = () => {
 const navigate = useNavigate();
  const location = useLocation();
  const isDiaryOrCalendar = location.pathname.includes('/diary') || location.pathname.includes('/calendar');
 const dispatch = useDispatch<AppDispatch>();
 const user = useSelector((state: RootState) => state.auth.user);
 const { profile, myClinics } = useSelector((state: RootState) => state.clinic);
 const { unreadCount } = useSelector((state: RootState) => state.notifications);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);

 React.useEffect(() => {
 dispatch(fetchMyClinics());
 const savedClinicId = localStorage.getItem('activeClinicId') || undefined;
 dispatch(fetchClinicProfile(savedClinicId));
 if (user) {
 dispatch(fetchUnreadCount());
 }
 }, [dispatch, user]);

 const handleClinicChange = async (newClinicId: string) => {
 localStorage.setItem('activeClinicId', newClinicId);
 await dispatch(fetchClinicProfile(newClinicId));
 dispatch(fetchAppointments({ clinicId: newClinicId }));
 dispatch(fetchServices(newClinicId));
 };

 const menuItems = getMenuItemsForRole(user?.role || '');

 const handleLogout = async () => {
 try {
 localStorage.removeItem('accessToken');
 localStorage.removeItem('refreshToken');
 await dispatch(logout());
 navigate('/login');
 } catch (error) {
 console.error('Logout failed:', error);
 }
 };

 const closeSidebar = () => setIsSidebarOpen(false);

  const [currentLang, setCurrentLang] = useState<'en' | 'el'>(
    (localStorage.getItem('preferredLang') as 'en' | 'el') || 'en'
  );

  const handleLanguageSwitch = (lang: 'en' | 'el') => {
    setCurrentLang(lang);
    localStorage.setItem('preferredLang', lang);
    window.dispatchEvent(new Event('storage'));
    (window as any).switchLanguage?.(lang);
  };

  return (
  <div className="flex h-[calc(100vh-100px)] lg:h-[calc(100vh-108px)] bg-[#F8FAFC] overflow-hidden font-sans">
  {/* Mobile sidebar toggle */}
  <button
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
  className="lg:hidden fixed bottom-5 right-5 z-[1002] size-12 bg-black text-[#CBFF38] rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-all"
  >
  {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
  </button>

  {/* Mobile overlay */}
  {isSidebarOpen && (
  <div
  className="lg:hidden fixed inset-0 top-[56px] sm:top-[64px] bg-black/40 z-[1000]"
  onClick={closeSidebar}
  />
  )}

  {/* Sidebar */}
  <aside
    className={`fixed lg:static top-[56px] sm:top-[64px] lg:top-0 bottom-0 left-0 z-[1001] lg:z-10 w-72 bg-white flex flex-col transition-all duration-500 ease-in-out border-r border-gray-100 h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] lg:h-full
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
  >
    {/* Branding */}
    <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="size-8 bg-black rounded-lg flex items-center justify-center text-[#CBFF38] shrink-0">
          <LayoutDashboard size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-black uppercase tracking-tight text-gray-900 truncate notranslate" title={profile?.name || 'Clinic Portal'}>
            {profile?.name || 'Clinic Portal'}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="size-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Multi-Clinic Switcher Dropdown */}
      {((myClinics && myClinics.length > 0) || profile) && (
        <div className="mt-2.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#CBFF38]" />
              {myClinics && myClinics.length > 1 ? 'Switch Clinic' : 'Active Clinic'}
            </label>
            {myClinics && myClinics.length > 1 && (
              <span className="text-[8px] font-bold bg-[#CBFF38]/20 text-[#0B1120] px-1.5 py-0.2 rounded">
                {myClinics.length}
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={profile?.id || (myClinics[0]?.id) || ''}
              onChange={(e) => handleClinicChange(e.target.value)}
              disabled={!myClinics || myClinics.length <= 1}
              className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-gray-900 appearance-none pr-7 outline-none truncate transition-colors ${
                myClinics && myClinics.length > 1
                  ? 'cursor-pointer hover:bg-gray-100 focus:ring-1 focus:ring-[#CBFF38]'
                  : 'cursor-default opacity-90'
              }`}
            >
              {(myClinics && myClinics.length > 0 ? myClinics : (profile ? [profile] : [])).map((c) => (
                <option key={c.id} value={c.id}>
                  🏥 {c.name} {c.address?.city ? `(${c.address.city})` : ''}
                </option>
              ))}
            </select>
            {myClinics && myClinics.length > 1 && (
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            )}
          </div>
        </div>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 min-h-0 px-3 py-2 overflow-y-auto custom-scrollbar">
      <div className="space-y-0.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-black text-[#CBFF38] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
              }`
            }
          >
            <div className="transition-transform duration-200 group-hover:scale-105 shrink-0">
              {iconMap[item.icon]}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider truncate">
              {currentLang === 'el' && (item as any).labelGr ? (item as any).labelGr : item.label}
            </span>
            {item.id === 'appointments' && (
              <div className="ml-auto size-4 rounded-full bg-[#CBFF38] text-black text-[8px] font-black flex items-center justify-center shadow-sm shrink-0">
                !
              </div>
            )}
            {item.id === 'my-notifications' && unreadCount > 0 && (
              <div className="ml-auto bg-black text-[#CBFF38] text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>

    {/* User Profile & Logout */}
    <div className="p-3 m-3 mt-1 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2 shrink-0">
      {/* Language Switcher */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-white rounded-lg border border-gray-100">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Language</span>
        <div className="flex items-center rounded-md overflow-hidden border border-gray-200 bg-white">
          <button
            onClick={() => handleLanguageSwitch('en')}
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all ${
              currentLang === 'en'
                ? 'bg-[#CBFF38] text-black shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
            title="Switch to English"
          >
            EN
          </button>
          <div className="w-px h-3 bg-gray-200" />
          <button
            onClick={() => handleLanguageSwitch('el')}
            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all ${
              currentLang === 'el'
                ? 'bg-[#CBFF38] text-black shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
            title="Switch to Greek"
          >
            ΕΛ
          </button>
        </div>
      </div>

      {/* User Info & Sign Out */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="size-7 bg-white shadow-xs rounded-lg border border-gray-100 flex items-center justify-center shrink-0 notranslate">
            <span className="text-black font-black text-[10px]">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-[10px] uppercase tracking-tight text-gray-900 truncate notranslate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight truncate leading-none notranslate">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="size-7 flex items-center justify-center bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg border border-gray-100 transition-all shadow-xs shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </aside>

 {/* Main Content */}
 <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
  <div className={`flex-1 flex flex-col min-h-0 min-w-0 h-full ${isDiaryOrCalendar ? 'overflow-y-hidden overflow-x-auto' : 'overflow-y-auto overflow-x-auto no-scrollbar'}`}>
  <Outlet />
  </div>
  </main>
 </div>
 );
};

export default ClinicLayout;
