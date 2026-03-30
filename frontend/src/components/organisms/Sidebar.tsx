import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchConversations } from "@/store/slices/messagesSlice";
import { useEffect } from "react";

import {
  LayoutDashboard, Users, BarChart2, Tag, Eye, Settings,
  Building2,
  Calendar, CalendarRange, FileText, BarChart, Shield, DollarSign,
  ClipboardList, Repeat, UserCog, ListChecks, Clock,
  Phone, Search, LogOut, MessageSquare, Archive, Bell, Key
} from "lucide-react";

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  group?: string;
}

const clientLinks: SidebarItem[] = [
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Communication" },
  { path: "/search", label: "Search", icon: <Search className="w-5 h-5" /> },
  { path: "/appointments", label: "Appointments", icon: <Calendar className="w-5 h-5" /> },
  { path: "/history", label: "History", icon: <ClipboardList className="w-5 h-5" /> },
  { path: "/reviews", label: "Reviews", icon: <Eye className="w-5 h-5" /> },
  { path: "/loyalty", label: "Loyalty", icon: <Tag className="w-5 h-5" /> },
  { path: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" />, group: "Account" },
];

const clinicLinks: SidebarItem[] = [
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Communication" },
  { path: "/clinic/profile", label: "Profile", icon: <UserCog className="w-5 h-5" />, group: "Account" },
  { path: "/clinic/staff", label: "Staff Management", icon: <Users className="w-5 h-5" />, group: "Account" },
  { path: "/clinic/diary", label: "Diary", icon: <FileText className="w-5 h-5" />, group: "Operations" },
  { path: "/clinic/availability", label: "Availability", icon: <Calendar className="w-5 h-5" />, group: "Operations" },
  { path: "/clinic/execution", label: "Execution", icon: <ListChecks className="w-5 h-5" />, group: "Operations" },
  { path: "/clinic/reports", label: "Reports", icon: <BarChart className="w-5 h-5" />, group: "Operations" },
  { path: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" />, group: "Account" },
];

const secretariatLinks: SidebarItem[] = [
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Communication" },
  { path: "/clinic/diary", label: "Diary", icon: <FileText className="w-5 h-5" />, group: "Operations" },
  { path: "/clinic/appointments", label: "Appointments", icon: <Calendar className="w-5 h-5" />, group: "Operations" },
  { path: "/clinic/availability-settings", label: "Availability", icon: <Clock className="w-5 h-5" />, group: "Operations" },
];

const doctorLinks: SidebarItem[] = [
  { path: "/clinic/diary", label: "My Appointments", icon: <Calendar className="w-5 h-5" />, group: "Operations" },
];

const crmLinks: SidebarItem[] = [
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Communication" },
  { path: "/crm/customers", label: "Customers", icon: <Users className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/archive", label: "Archive", icon: <Archive className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/leads", label: "Leads", icon: <Repeat className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/tasks", label: "Tasks", icon: <ListChecks className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/repeat-management", label: "Repeat Management", icon: <Repeat className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/communication", label: "Communication Flow", icon: <Phone className="w-5 h-5" />, group: "Communication" },
  { path: "/crm/analytics", label: "Analytics", icon: <BarChart2 className="w-5 h-5" />, group: "Performance" },
  { path: "/crm/sales-analytics", label: "Sales Dashboard", icon: <BarChart2 className="w-5 h-5" />, group: "Performance" },
  { path: "/crm/calendar", label: "Sales Week Calendar", icon: <Calendar className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/tag", label: "Tags", icon: <Tag className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/facebook-integration", label: "Facebook Integration", icon: <Repeat className="w-5 h-5" />, group: "Marketing" },
  { path: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" />, group: "Account" },
];

const managerLinks: SidebarItem[] = [
  { path: "/admin/manager-dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, group: "Main" },
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Communication" },
  { path: "/admin/clinics", label: "Clinics", icon: <Building2 className="w-5 h-5" />, group: "Main" },
  { path: "/admin/users", label: "Users & Roles", icon: <Users className="w-5 h-5" />, group: "Main" },

  { path: "/crm/customers", label: "Contacts", icon: <Users className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/leads", label: "Leads", icon: <Repeat className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/archive", label: "Archive", icon: <Archive className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/tasks", label: "Tasks", icon: <ListChecks className="w-5 h-5" />, group: "CRM" },

  { path: "/crm/analytics", label: "Sales Analytics", icon: <BarChart2 className="w-5 h-5" />, group: "Sales" },
  { path: "/admin/clinic-analytics", label: "Clinic Analytics", icon: <Building2 className="w-5 h-5" />, group: "Sales" },
   { path: "/admin/manager-dashboard?tab=calendar-global", label: "Global Calendar", icon: <CalendarRange className="w-5 h-5" />, group: "Sales" },
   { path: "/admin/manager-crm/calls", label: "Calls", icon: <Phone className="w-5 h-5" />, group: "Sales" },
   { path: "/admin/manager-crm/reports", label: "Reports", icon: <FileText className="w-5 h-5" />, group: "Analytics" },
   { path: "/admin/manager-crm/advertising", label: "Advertising", icon: <BarChart className="w-5 h-5" />, group: "Analytics" },
   { path: "/admin/broadcast", label: "Broadcast", icon: <Bell className="w-5 h-5" />, group: "Marketing" },
   { path: "/admin/manager-crm/access", label: "Access Control", icon: <Shield className="w-5 h-5" />, group: "CRM Management" },
   { path: "/admin/manager-crm/benefits", label: "Client Benefits", icon: <Tag className="w-5 h-5" />, group: "CRM Management" },
   { path: "/admin/manager-crm/no-show-alerts", label: "No-Show Alerts", icon: <Eye className="w-5 h-5" />, group: "CRM Management" },

  { path: "/admin/payments", label: "Payments & Turnover", icon: <DollarSign className="w-5 h-5" />, group: "Finance" },
  { path: "/admin/gift-cards", label: "Gift Cards", icon: <Tag className="w-5 h-5" />, group: "Finance" },
  { path: "/admin/wallet", label: "Loyalty & Wallet", icon: <ClipboardList className="w-5 h-5" />, group: "Finance" },

  { path: "/admin/reviews", label: "Review Approvals", icon: <Eye className="w-5 h-5" />, group: "Content & Approvals" },
  { path: "/admin/treatments", label: "Therapy Catalog", icon: <ListChecks className="w-5 h-5" />, group: "Content & Approvals" },
  { path: "/admin/blog", label: "Blog & Content", icon: <FileText className="w-5 h-5" />, group: "Content & Approvals" },

  { path: "/admin/integrations", label: "Integrations", icon: <Settings className="w-5 h-5" />, group: "System" },
  { path: "/admin/system-lists", label: "System-wide Lists", icon: <ListChecks className="w-5 h-5" />, group: "System" },
  { path: "/admin/notification-settings", label: "Notification Templates", icon: <Bell className="w-5 h-5" />, group: "System" },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: <Shield className="w-5 h-5" />, group: "System" },
  { path: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" />, group: "System" },
];

const getAdminLinks = (role: string): SidebarItem[] => {
  if (role === 'SUPER_ADMIN' || role === 'manager') {
    return managerLinks;
  }

  // Fallback for regular `admin` 
  return [
    { path: "/admin/dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, group: "Main" },
    { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Communication" },
    { path: "/admin/clinics", label: "Clinics", icon: <Building2 className="w-5 h-5" />, group: "Main" },
    { path: "/admin/users", label: "Users & Roles", icon: <Users className="w-5 h-5" />, group: "Main" },
    { path: "/admin/reviews", label: "Review Moderation", icon: <Eye className="w-5 h-5" />, group: "Approvals" },
    { path: "/admin/treatments", label: "Therapy Catalog", icon: <ListChecks className="w-5 h-5" />, group: "Approvals" },
    { path: "/admin/notification-settings", label: "Notification Settings", icon: <Bell className="w-5 h-5" />, group: "System" },
    { path: "/admin/system-lists", label: "System Lists", icon: <ListChecks className="w-5 h-5" />, group: "System" },
    { path: "/admin/audit-logs", label: "Audit Logs", icon: <Shield className="w-5 h-5" />, group: "System" },
    { path: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" />, group: "System" },
  ];
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { conversations } = useAppSelector((state) => state.messages);

  const totalUnread = (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    if (user) {
      dispatch(fetchConversations());
    }
  }, [dispatch, user]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };
  const role = (user?.role as string) || "";

  const links =
    role === "client"
      ? clientLinks
      : role === "clinic_owner" || role === "secretariat" || role === "doctor"
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
      case 'clinic_owner':
      case 'doctor':
      case 'secretariat': return '/clinic/dashboard';
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
          <div key={group} className="mb-6 last:mb-0">
            {group !== 'General' && (
              <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-4 mb-3 opacity-80">
                {group}
              </h3>
            )}
            <ul className="space-y-1">
              {groupLinks.map((link) => {
                const isActive = link.path.includes('?')
                  ? location.pathname + (location.search || '') === link.path
                  : location.pathname === link.path;
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
                      <span className="relative z-10 flex-1">{link.label}</span>

                      {link.path === '/messages' && totalUnread > 0 && (
                        <div className="relative z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-md shadow-red-500/20 animate-pulse">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </div>
                      )}

                      {/* Active Indicator (optional, keeping minimal as per request) */}

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
