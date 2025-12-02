import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { 
  LayoutDashboard, Users, BarChart2, Tag, Eye, Bell, Settings, 
  Calendar, FileText, BarChart, Shield, DollarSign, AlertCircle,
  Home, ClipboardList, Repeat, UserCog, LineChart, ListChecks,
  Phone
} from "lucide-react";

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const clientLinks: SidebarItem[] = [
  { path: "/search", label: "Search", icon: <Home className="w-5 h-5" /> },
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
];

const getAdminLinks = (role: string): SidebarItem[] => {
  const baseLinks = [
    { path: "/admin/users", label: "Users", icon: <Users className="w-5 h-5" />, group: "Administration" },
    { path: "/admin/loyalty-management", label: "Loyalty Management", icon: <Tag className="w-5 h-5" />, group: "Settings" },
    { path: "/admin/monitor", label: "Monitor", icon: <BarChart2 className="w-5 h-5" />, group: "Analytics" },
  ];

  if (role === 'SUPER_ADMIN') {
    return [
      { path: "/admin/manager-dashboard", label: "Manager Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, group: "Overview" },
      { path: "/admin/manager-crm/calls", label: "CRM Calls", icon: <Phone className="w-5 h-5" />, group: "CRM" },
      { path: "/admin/manager-crm/reports", label: "CRM Reports", icon: <FileText className="w-5 h-5" />, group: "CRM" },
      { path: "/admin/manager-crm/advertising", label: "Advertising", icon: <BarChart2 className="w-5 h-5" />, group: "Marketing" },
      { path: "/admin/manager-crm/access", label: "Access Control", icon: <Shield className="w-5 h-5" />, group: "Settings" },
      { path: "/admin/manager-crm/benefits", label: "Benefits", icon: <DollarSign className="w-5 h-5" />, group: "Settings" },
      { path: "/admin/manager-crm/no-show-alerts", label: "No-Show Alerts", icon: <AlertCircle className="w-5 h-5" />, group: "Alerts" },
      { path: "/admin/manager-crm/clinic-stats", label: "Clinic Stats", icon: <LineChart className="w-5 h-5" />, group: "Analytics" },
    ];
  }
  
  return [
    { path: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    ...baseLinks,
  ];
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role || "";

  const links =
    role === "client"
      ? clientLinks
      : role === "clinic_owner"
        ? clinicLinks
        : role === "admin"
          ? getAdminLinks(role)
          : role === "SUPER_ADMIN"
            ? getAdminLinks(role)
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

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 h-screen flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="bg-[#CBFF38] text-gray-900 p-1 rounded">
            <LayoutDashboard className="w-5 h-5" />
          </span>
          Manager Panel
        </h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {Object.entries(groupedLinks).map(([group, groupLinks]) => (
          <div key={group} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
              {group}
            </h3>
            <ul className="space-y-1">
              {groupLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#CBFF38] text-gray-900 shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span className={isActive ? 'text-gray-900' : 'text-[#CBFF38]'}>
                        {link.icon}
                      </span>
                      {link.label}
                      {isActive && (
                        <span className="ml-auto w-2 h-2 bg-green-400 rounded-full"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-[#CBFF38] flex items-center justify-center">
            <span className="text-gray-900 font-bold text-sm">
              {user.firstName?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {role.replace('_', ' ').toLowerCase()}
            </p>
          </div>
          <button className="text-gray-400 hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
