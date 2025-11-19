import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getMenuItemsForRole } from '../../utils/rolePermissions';
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
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
  const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.clinic);

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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-lime-500">
            {profile?.name || 'Clinic Portal'}
          </h1>
          <p className="text-sm text-gray-600 mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#CBFF38] text-[#33373F] font-medium'
                        : 'text-gray-700 hover:bg-lime-200'
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ClinicLayout;
