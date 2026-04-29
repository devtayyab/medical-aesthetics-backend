import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchConversations } from "@/store/slices/messagesSlice";
import { useEffect } from "react";
import { fetchUnreadCount } from "@/store/slices/notificationsSlice";
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
  { path: "/clinic/dashboard", label: "Overview", icon: <LayoutDashboard size={20} />, group: "Main" },
  { path: "/clinic/my-notifications", label: "Notifications", icon: <Bell size={20} />, group: "Communication" },
  { path: "/messages", label: "Messages", icon: <MessageSquare size={20} />, group: "Communication" },
  { path: "/clinic/notifications", label: "Campaign Outreach", icon: <Phone size={20} />, group: "Communication" },

  { path: "/clinic/profile", label: "Profile", icon: <UserCog size={20} />, group: "Account" },
  { path: "/clinic/staff", label: "Staff Hub", icon: <Users size={20} />, group: "Account" },

  { path: "/clinic/diary", label: "Service Diary", icon: <FileText size={20} />, group: "Operations" },
  { path: "/clinic/availability", label: "Availability", icon: <Calendar size={20} />, group: "Operations" },
  { path: "/clinic/execution", label: "Clinical Execution", icon: <ListChecks size={20} />, group: "Operations" },
  { path: "/clinic/reports", label: "Metric Reports", icon: <BarChart size={20} />, group: "Operations" },
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
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/tasks", label: "Tasks", icon: <ListChecks className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/leads", label: "Leads", icon: <Repeat className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/customers", label: "Customers", icon: <Users className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/calendar", label: "Sales Week Calendar", icon: <Calendar className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/repeat-management", label: "Repeat Management", icon: <Repeat className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/archive", label: "Archive", icon: <Archive className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/tag", label: "Tags", icon: <Tag className="w-5 h-5" />, group: "Operations" },

  { path: "/crm/communication", label: "Communication Flow", icon: <Phone className="w-5 h-5" />, group: "Performance" },
  { path: "/crm/analytics", label: "Statistics", icon: <BarChart2 className="w-5 h-5" />, group: "Performance" },
  { path: "/crm/sales-analytics", label: "Sales Dashboard", icon: <BarChart2 className="w-5 h-5" />, group: "Performance" },
  { path: "/change-password", label: "Change Password", icon: <Key className="w-5 h-5" />, group: "Account" },
];

const managerLinks: SidebarItem[] = [
  { path: "/admin/manager-dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, group: "Main" },
  { path: "/messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/tasks", label: "Tasks", icon: <ListChecks className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/leads", label: "Leads", icon: <Repeat className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/customers", label: "Customers", icon: <Users className="w-5 h-5" />, group: "Sales" },

  { path: "/admin/clinics", label: "Clinics", icon: <Building2 className="w-5 h-5" />, group: "Infrastructure" },
  { path: "/admin/users", label: "Users & Roles", icon: <Users className="w-5 h-5" />, group: "Infrastructure" },

  { path: "/crm/analytics", label: "Sales Analytics", icon: <BarChart2 className="w-5 h-5" />, group: "Intelligence" },
  { path: "/admin/clinic-analytics", label: "Clinic Analytics", icon: <Building2 className="w-5 h-5" />, group: "Intelligence" },
  { path: "/admin/manager-dashboard?tab=calendar-global", label: "Global Calendar", icon: <CalendarRange className="w-5 h-5" />, group: "Intelligence" },
  { path: "/admin/manager-crm/calls", label: "Calls", icon: <Phone className="w-5 h-5" />, group: "Intelligence" },

  { path: "/admin/manager-crm/reports", label: "Reports", icon: <FileText className="w-5 h-5" />, group: "Analytics" },
  { path: "/admin/manager-crm/advertising", label: "Advertising", icon: <BarChart className="w-5 h-5" />, group: "Analytics" },
  { path: "/admin/broadcast", label: "Broadcast", icon: <Bell className="w-5 h-5" />, group: "Marketing" },
  { path: "/crm/facebook-integration", label: "Facebook Integration", icon: <Repeat className="w-5 h-5" />, group: "Marketing" },

  { path: "/admin/manager-crm/access", label: "Access Control", icon: <Shield className="w-5 h-5" />, group: "Management" },
  { path: "/admin/manager-crm/benefits", label: "Client Benefits", icon: <Tag className="w-5 h-5" />, group: "Management" },
  { path: "/admin/manager-crm/no-show-alerts", label: "No-Show Alerts", icon: <Eye className="w-5 h-5" />, group: "Management" },

  { path: "/admin/payments", label: "Payments & Turnover", icon: <DollarSign className="w-5 h-5" />, group: "Finance" },
  { path: "/admin/gift-cards", label: "Gift Cards", icon: <Tag className="w-5 h-5" />, group: "Finance" },
  { path: "/admin/wallet", label: "Loyalty & Wallet", icon: <ClipboardList className="w-5 h-5" />, group: "Finance" },

  { path: "/admin/reviews", label: "Review Approvals", icon: <Eye className="w-5 h-5" />, group: "Content" },
  { path: "/admin/treatments", label: "Therapy Catalog", icon: <ListChecks className="w-5 h-5" />, group: "Content" },
  { path: "/admin/blog", label: "Blog & Content", icon: <FileText className="w-5 h-5" />, group: "Content" },

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

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { conversations } = useAppSelector((state) => state.messages);
  const { unreadCount } = useAppSelector((state) => state.notifications);

  const totalUnread = (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    if (user) {
      dispatch(fetchConversations());
      dispatch(fetchUnreadCount());
    }
  }, [dispatch, user]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };
  const role = (user?.role as string) || "";
  const normalizedRole = role.toLowerCase();

  const links =
    normalizedRole === "client"
      ? clientLinks
      : normalizedRole === "clinic_owner" || normalizedRole === "secretariat" || normalizedRole === "doctor"
        ? clinicLinks
        : normalizedRole === "admin" || normalizedRole === "super_admin"
          ? getAdminLinks(role)
          : normalizedRole === "salesperson" || normalizedRole === "sales_person"
            ? crmLinks
            : normalizedRole === "manager"
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
      case 'doctor':
      case 'secretariat': return '/clinic/appointments';
      case 'salesperson': return '/crm';
      case 'client': return '/my-account';
      default: return '/';
    }
  };

  return (
    <aside className="w-64 lg:w-72 bg-white text-gray-900 flex flex-col border-r border-gray-100 shadow-sm h-full overflow-hidden shrink-0">
      <Link to={getHomePath(role)} className="p-6 border-b border-gray-50 bg-gradient-to-tr from-white to-gray-50/50 block hover:bg-gray-50/80 transition-all group">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-black rounded-2xl flex items-center justify-center text-[#CBFF38] shadow-xl shadow-lime-500/10 font-black italic text-xl border border-white/10 group-hover:rotate-6 transition-transform">
            {user.firstName?.substring(0, 1).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-black uppercase italic tracking-tighter leading-tight truncate">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="size-1.5 bg-[#CBFF38] rounded-full animate-pulse shadow-[0_0_5px_#CBFF38]" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 italic">
                {role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-8 px-5 no-scrollbar space-y-8">
        {Object.entries(groupedLinks).map(([group, groupLinks]) => (
          <div key={group}>
            {group !== 'General' && (
              <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-4 italic">
                {group}
              </h3>
            )}
            <ul className="space-y-1.5">
              {groupLinks.map((link) => {
                const isActive = link.path.includes('?')
                  ? location.pathname + (location.search || '') === link.path
                  : location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={(e) => {
                        if (onNavigate) onNavigate();
                        const restrictedPaths = ['/clinic/dashboard', '/clinic/analytics', '/clinic/staff', '/clinic/settings'];
                        const isRestrictedRole = role === 'doctor' || role === 'secretariat';
                        if (isRestrictedRole && restrictedPaths.includes(link.path)) {
                          e.preventDefault();
                          return;
                        }
                      }}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${isActive
                        ? 'text-black bg-[#CBFF38] shadow-lg shadow-lime-500/10'
                        : 'text-gray-500 hover:text-black hover:bg-gray-50'
                        }`}
                    >
                      <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {React.cloneElement(link.icon as React.ReactElement, { size: 18, strokeWidth: isActive ? 3 : 2 })}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest italic flex-1 ${isActive ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                        {link.label}
                      </span>

                      {link.path === '/messages' && totalUnread > 0 && (
                        <div className="bg-black text-[#CBFF38] text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </div>
                      )}

                      {link.path === '/clinic/my-notifications' && unreadCount > 0 && (
                        <div className="bg-black text-[#CBFF38] text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-50 bg-white">
        <div className="flex gap-3">
          <button
            onClick={() => {
              const routes: Record<string, string> = {
                'salesperson': '/crm/settings',
                'clinic_owner': '/clinic/settings',
                'manager': '/crm/settings',
                'admin': '/crm/settings',
                'super_admin': '/crm/settings',
                'doctor': '/crm/settings',
                'client': '/settings'
              };
              if (routes[role]) navigate(routes[role]);
              else navigate('/crm/settings'); // Default fallback for other staff
            }}
            className="size-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-black hover:text-[#CBFF38] transition-all border border-gray-100 shadow-sm active:scale-95 group"
            title="Account Settings"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 h-12 flex items-center justify-center gap-3 bg-red-500 text-white rounded-2xl font-black uppercase italic tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};
