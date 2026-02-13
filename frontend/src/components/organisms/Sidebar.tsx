import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

import {
  LayoutDashboard, Users, BarChart2, Tag, Eye, Settings,
  Calendar, FileText, BarChart, Shield, DollarSign, AlertCircle,
  ClipboardList, Repeat, UserCog, LineChart, ListChecks,
  Phone, Search, LogOut
} from "lucide-react";

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const clientLinks: SidebarItem[] = [
  { path: "/search", label: "Search", icon: <Search className="w-5 h-5" /> },
  { path: "/appointments", label: "Appointments", icon: <Calendar className="w-5 h-5" /> },
  { path: "/history", label: "History", icon: <ClipboardList className="w-5 h-5" /> },
  { path: "/reviews", label: "Reviews", icon: <Eye className="w-5 h-5" /> },
  { path: "/loyalty", label: "Loyalty", icon: <Tag className="w-5 h-5" /> },
];

const clinicLinks: SidebarItem[] = [
  { path: "/clinic/profile", label: "Profile", icon: <UserCog className="w-5 h-5" /> },
  { path: "/clinic/diary", label: "Diary", icon: <FileText className="w-5 h-5" /> },
  { path: "/clinic/availability", label: "Availability", icon: <Calendar className="w-5 h-5" /> },
  { path: "/clinic/execution", label: "Execution", icon: <ListChecks className="w-5 h-5" /> },
  { path: "/clinic/reports", label: "Reports", icon: <BarChart className="w-5 h-5" /> },
];

const crmLinks: SidebarItem[] = [
  { path: "/crm/customers", label: "Customers", icon: <Users className="w-5 h-5" /> },
  { path: "/crm/tasks", label: "Tasks", icon: <ListChecks className="w-5 h-5" /> },
  { path: "/crm/actions", label: "Actions", icon: <Repeat className="w-5 h-5" /> },
  { path: "/crm/repeat-management", label: "Repeat Management", icon: <Repeat className="w-5 h-5" /> },
  { path: "/crm/leads", label: "Leads", icon: <Repeat className="w-5 h-5" /> },
  { path: "/crm/communication", label: "Communication", icon: <Repeat className="w-5 h-5" /> },
  { path: "/crm/analytics", label: "Analytics", icon: <Repeat className="w-5 h-5" /> },
  { path: "/crm/tag", label: "Tags", icon: <Repeat className="w-5 h-5" /> },
  { path: "/crm/facebook-integration", label: "Facebook Integration", icon: <Repeat className="w-5 h-5" /> },
];

const managerLinks: SidebarItem[] = [
  { path: "/admin/manager-dashboard", label: "Manager Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, group: "Overview" },
  { path: "/admin/manager-crm/calls", label: "CRM Calls", icon: <Phone className="w-5 h-5" />, group: "CRM" },
  { path: "/admin/manager-crm/reports", label: "CRM Reports", icon: <FileText className="w-5 h-5" />, group: "CRM" },
  { path: "/admin/manager-crm/advertising", label: "Advertising", icon: <BarChart2 className="w-5 h-5" />, group: "Marketing" },
  { path: "/admin/manager-crm/access", label: "Access Control", icon: <Shield className="w-5 h-5" />, group: "Settings" },
  { path: "/admin/manager-crm/benefits", label: "Benefits", icon: <DollarSign className="w-5 h-5" />, group: "Settings" },
  { path: "/admin/manager-crm/no-show-alerts", label: "No-Show Alerts", icon: <AlertCircle className="w-5 h-5" />, group: "Alerts" },
  { path: "/admin/manager-crm/clinic-stats", label: "Clinic Stats", icon: <LineChart className="w-5 h-5" />, group: "Analytics" },
];

const getAdminLinks = (role: string): SidebarItem[] => {
  const baseLinks = [
    { path: "/admin/users", label: "Users", icon: <Users className="w-5 h-5" />, group: "Administration" },
    { path: "/admin/loyalty-management", label: "Loyalty Management", icon: <Tag className="w-5 h-5" />, group: "Settings" },
    { path: "/admin/monitor", label: "Monitor", icon: <BarChart2 className="w-5 h-5" />, group: "Analytics" },
  ];

  if (role === 'SUPER_ADMIN' || role === 'manager') {
    return managerLinks;
  }

  return [
    { path: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    ...baseLinks,
  ];
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };
  const role = (user?.role as string) || "";

  const links =
    role === "client"
      ? clientLinks
      : role === "clinic_owner"
        ? clinicLinks
        : role === "admin"
          ? getAdminLinks(role)
          : role === "SUPER_ADMIN"
            ? getAdminLinks(role)
            : role === "salesperson"
              ? crmLinks
              : role === "manager"
                ? managerLinks
                : [];

  // Group links by their group property
  const groupedLinks = links.reduce<Record<string, SidebarItem[]>>((acc, link) => {
    const group = link.group || 'General';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(link);

    return acc;
  }, {});

  const getHomePath = (userRole: string) => {
    switch (userRole) {
      case 'SUPER_ADMIN': return '/admin/manager-dashboard';
      case 'admin': return '/admin/dashboard';
      case 'clinic_owner': return '/clinic/dashboard';
      case 'salesperson': return '/crm';
      case 'client': return '/my-account';
      default: return '/';
    }
  };

  return (
    <aside className="w-64 bg-[#0B1120] text-gray-300 flex flex-col border-r border-gray-800 shadow-2xl z-40 sticky top-[88px] sm:top-[104px] h-[calc(100vh-88px)] sm:h-[calc(100vh-104px)]">
      <div className="p-6 border-b border-gray-800/50 bg-[#0B1120]">
        <Link to={getHomePath(role)} className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-[#CBFF38] to-[#A3D900] text-gray-900 p-2 rounded-xl shadow-lg shadow-[#CBFF38]/20 group-hover:scale-105 transition-transform duration-300">
            <LayoutDashboard className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight group-hover:text-gray-200 transition-colors">
            {role === 'salesperson' ? 'Sales Panel' : role === 'clinic_owner' ? 'Clinic Panel' : 'Manager Panel'}
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
        {Object.entries(groupedLinks).map(([group, groupLinks]) => (
          <div key={group} className="mb-8 last:mb-0">
            <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-4 mb-3 opacity-80">
              {group}
            </h3>
            <ul className="space-y-1">
              {groupLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${isActive
                        ? 'text-[#0B1120] bg-[#CBFF38] shadow-lg shadow-[#CBFF38]/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                    >
                      <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {link.icon}
                      </span>
                      <span className="relative z-10">{link.label}</span>

                      {/* Active Indicator (optional, keeping minimal as per request) */}
                      {isActive && (
                        <div className="absolute right-3 w-1.5 h-1.5 bg-black/20 rounded-full z-10"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 bg-[#0B1120]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#CBFF38] to-[#98CC00] flex items-center justify-center shadow-lg shadow-[#CBFF38]/10 group-hover:scale-105 transition-transform">
            <span className="text-gray-900 font-bold text-sm">
              {user.firstName?.substring(0, 2).toUpperCase() || 'US'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-[#CBFF38] transition-colors">
              {user?.firstName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate font-medium">
              {role.replace('_', ' ').toLowerCase()}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (role === 'salesperson') {
                  navigate('/crm/settings');
                } else if (role === 'clinic_owner') {
                  navigate('/clinic/settings');
                } else if (role === 'client') {
                  navigate('/settings');
                }
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
