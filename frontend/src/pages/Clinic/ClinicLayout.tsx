import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getMenuItemsForRole } from '../../utils/rolePermissions';
import { logout } from "@/store/slices/authSlice";
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
} from 'lucide-react';

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
};

const ClinicLayout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { profile } = useSelector((state: RootState) => state.clinic);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-bold text-lime-600 truncate max-w-[200px]">
            {profile?.name || 'Clinic Portal'}
          </h1>
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg flex flex-col transition-transform duration-300 transform 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Brand (Desktop) */}
        <div className="hidden lg:block p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-lime-500">
            {profile?.name || 'Clinic Portal'}
          </h1>
          <p className="text-sm text-gray-600 mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>

        {/* Mobile Sidebar Header */}
        <div className="lg:hidden p-4 border-b border-gray-200 flex items-center justify-between bg-lime-50">
          <div>
            <h2 className="font-bold text-gray-900">Menu</h2>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={closeSidebar} className="p-1 rounded-md hover:bg-lime-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-[#CBFF38] text-[#33373F] font-medium'
                      : 'text-gray-700 hover:bg-lime-50'
                    }`
                  }
                >
                  {iconMap[item.icon]}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <div className="flex-1 overflow-y-auto pt-[60px] lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ClinicLayout;
