import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getMenuItemsForRole } from '../../utils/rolePermissions';
import { logout } from"@/store/slices/authSlice";
import { fetchClinicProfile } from '@/store/slices/clinicSlice';
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
 const dispatch = useDispatch<AppDispatch>();
 const user = useSelector((state: RootState) => state.auth.user);
 const { profile } = useSelector((state: RootState) => state.clinic);
 const { unreadCount } = useSelector((state: RootState) => state.notifications);
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);

 React.useEffect(() => {
 if (!profile) {
 dispatch(fetchClinicProfile());
 }
 if (user) {
 dispatch(fetchUnreadCount());
 }
 }, [dispatch, profile, user]);

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

 return (
 <div className="flex h-[calc(100vh-56px)] lg:h-[calc(100vh-64px)] bg-[#F8FAFC] overflow-hidden font-sans">
 {/* Sidebar */}
 <aside
 className={`fixed lg:static top-[56px] lg:top-0 bottom-0 left-0 z-30 w-72 bg-white flex flex-col transition-all duration-500 ease-in-out border-r border-gray-100
 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
 `}
 >
 {/* Branding */}
 <div className="p-8 pb-6">
 <div className="flex items-center gap-3 mb-1">
 <div className="size-8 bg-black rounded-lg flex items-center justify-center text-[#CBFF38]">
 <LayoutDashboard size={18} />
 </div>
 <h1 className="text-xl font-black uppercase tracking-tighter text-gray-900">
 {profile?.name || 'Clinic Portal'}
 </h1>
 </div>
 <div className="flex items-center gap-2 mt-4 px-1">
 <div className="size-1.5 rounded-full bg-green-500" />
 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Online</span>
 </div>
 </div>

 {/* Navigation */}
 <nav className="flex-1 px-4 py-4 overflow-y-auto no-scrollbar">
 <div className="space-y-1">
 {menuItems.map((item) => (
 <NavLink
 key={item.id}
 to={item.path}
 onClick={closeSidebar}
 className={({ isActive }) =>
 `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
 ? 'bg-black text-[#CBFF38]'
 : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
 }`
 }
 >
 <div className="transition-transform duration-300 group-hover:scale-105">
 {iconMap[item.icon]}
 </div>
 <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
 {item.id === 'appointments' && (
 <div className="ml-auto size-4 rounded-full bg-[#CBFF38] text-black text-[8px] font-black flex items-center justify-center shadow-sm">
 !
 </div>
 )}
 {item.id === 'my-notifications' && unreadCount > 0 && (
 <div className="ml-auto bg-black text-[#CBFF38] text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
 {unreadCount > 99 ? '99+' : unreadCount}
 </div>
 )}
 </NavLink>
 ))}
 </div>
 </nav>

 {/* User Profile & Logout */}
 <div className="p-5 m-4 bg-gray-50 rounded-2xl border border-gray-100">
 <div className="flex items-center gap-3 mb-4">
 <div className="size-9 bg-white shadow-sm rounded-xl flex items-center justify-center shrink-0">
 <span className="text-black font-black text-xs">
 {user?.firstName?.[0]}{user?.lastName?.[0]}
 </span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-black text-[9px] uppercase tracking-tighter text-gray-900 truncate">
 {user?.firstName} {user?.lastName}
 </p>
 <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight truncate leading-none mt-1">{user?.role?.replace('_', ' ')}</p>
 </div>
 </div>
 <button
 onClick={handleLogout}
 className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl border border-gray-100 transition-all font-black uppercase text-[9px] tracking-widest shadow-sm"
 >
 <LogOut className="w-4 h-4" />
 <span>Sign Out</span>
 </button>
 </div>
 </aside>

 {/* Main Content */}
 <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
 <div className="flex-1 overflow-y-auto no-scrollbar">
 <Outlet />
 </div>
 </main>
 </div>
 );
};

export default ClinicLayout;
