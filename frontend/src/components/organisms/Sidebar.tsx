import React from"react";
import { Link, useLocation, useNavigate } from"react-router-dom";
import { useAppSelector, useAppDispatch } from"@/store/hooks";
import { logout } from"@/store/slices/authSlice";
import { fetchConversations } from"@/store/slices/messagesSlice";
import { useEffect } from"react";
import { fetchUnreadCount } from"@/store/slices/notificationsSlice";
import {
 LayoutDashboard, Users, BarChart2, Tag, Eye, Settings,
 Building2,
 Calendar, CalendarRange, FileText, BarChart, Shield, DollarSign,
 ClipboardList, Repeat, UserCog, ListChecks, Clock,
 Phone, Search, LogOut, MessageSquare, Bell, Key, UserX,
 ChevronLeft, ChevronRight
} from"lucide-react";

interface SidebarItem {
  path: string;
  label: string;
  labelGr?: string;
  icon: React.ReactNode;
  group?: string;
}

const clientLinks: SidebarItem[] = [
 { path:"/messages", label:"Messages", icon: <MessageSquare className="w-5 h-5" />, group:"Communication" },
 { path:"/search", label:"Search", icon: <Search className="w-5 h-5" /> },
 { path:"/appointments", label:"Appointments", icon: <Calendar className="w-5 h-5" /> },
 { path:"/history", label:"History", icon: <ClipboardList className="w-5 h-5" /> },
 { path:"/reviews", label:"Reviews", icon: <Eye className="w-5 h-5" /> },
 { path:"/change-password", label:"Change Password", icon: <Key className="w-5 h-5" />, group:"Account" },
];

const clinicLinks: SidebarItem[] = [
 { path:"/clinic/dashboard", label:"Overview", icon: <LayoutDashboard size={20} />, group:"Main" },
 { path:"/clinic/my-notifications", label:"Notifications", icon: <Bell size={20} />, group:"Communication" },
 { path:"/messages", label:"Messages", icon: <MessageSquare size={20} />, group:"Communication" },
 { path:"/clinic/notifications", label:"Campaign Outreach", icon: <Phone size={20} />, group:"Communication" },

 { path:"/clinic/profile", label:"Profile", icon: <UserCog size={20} />, group:"Account" },
 { path:"/clinic/staff", label:"Staff Hub", icon: <Users size={20} />, group:"Account" },

 { path:"/clinic/diary", label:"Service Diary", icon: <FileText size={20} />, group:"Operations" },
 { path:"/clinic/availability", label:"Availability", icon: <Calendar size={20} />, group:"Operations" },
 { path:"/clinic/execution", label:"Clinical Execution", icon: <ListChecks size={20} />, group:"Operations" },
 { path:"/clinic/reports", label:"Metric Reports", icon: <BarChart size={20} />, group:"Operations" },
];


const crmLinks: SidebarItem[] = [
  { path: "/messages", label: "Messages", labelGr: "Μηνύματα", icon: <MessageSquare className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/tasks", label: "Tasks", labelGr: "Tasks", icon: <ListChecks className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/leads", label: "Leads", labelGr: "Leads", icon: <Repeat className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/lost-leads", label: "Lost Leads", labelGr: "Lost Leads", icon: <UserX className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/customers", label: "Customers", labelGr: "Πελάτες", icon: <Users className="w-5 h-5" />, group: "CRM" },
  { path: "/crm/calendar", label: "Sales Calendar", labelGr: "Ημερολόγιο Πωλήσεων", icon: <Calendar className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/repeat-management", label: "Repeat Management", labelGr: "Διαχείριση επαναληπτικών επαφών", icon: <Repeat className="w-5 h-5" />, group: "Operations" },
  { path: "/crm/tag", label: "Tags", labelGr: "Ετικέτες", icon: <Tag className="w-5 h-5" />, group: "Operations" },

  { path: "/crm/communication", label: "Communication Flow", labelGr: "Ιστορικό Επικοινωνίας", icon: <Phone className="w-5 h-5" />, group: "Performance" },
  { path: "/crm/analytics", label: "Statistics", labelGr: "Στατιστικά", icon: <BarChart2 className="w-5 h-5" />, group: "Performance" },
  { path: "/crm/sales-analytics", label: "Sales Dashboard", labelGr: "Sales Dashboard", icon: <BarChart2 className="w-5 h-5" />, group: "Performance" },
  { path: "/change-password", label: "Change Password", labelGr: "Αλλαγή κωδικού", icon: <Key className="w-5 h-5" />, group: "Account" },
];

const managerLinks: SidebarItem[] = [
  { path: "/admin/manager-dashboard", label: "Overview", labelGr: "Επισκόπηση", icon: <LayoutDashboard className="w-5 h-5" />, group: "Main" },
  { path: "/messages", label: "Messages", labelGr: "Μηνύματα", icon: <MessageSquare className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/tasks", label: "Tasks", labelGr: "Tasks", icon: <ListChecks className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/leads", label: "Leads", labelGr: "Leads", icon: <Repeat className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/lost-leads", label: "Lost Leads", labelGr: "Lost Leads", icon: <UserX className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/customers", label: "Customers", labelGr: "Πελάτες", icon: <Users className="w-5 h-5" />, group: "Sales" },
  { path: "/crm/communication", label: "Communication Flow", labelGr: "Ιστορικό Επικοινωνίας", icon: <Phone className="w-5 h-5" />, group: "Sales" },

  { path: "/admin/clinics", label: "Clinics Management", labelGr: "Διαχείριση Κλινικών", icon: <Building2 className="w-5 h-5" />, group: "Infrastructure" },
  { path: "/admin/users", label: "Users & Roles", labelGr: "Διαχείριση Χρηστών", icon: <Users className="w-5 h-5" />, group: "Infrastructure" },

  { path: "/crm/analytics", label: "Sales Analytics", labelGr: "Ανάλυση Πωλήσεων", icon: <BarChart2 className="w-5 h-5" />, group: "Intelligence" },
  { path: "/admin/clinic-analytics", label: "Clinic Analytics", labelGr: "Στατιστικά Κλινικών", icon: <Building2 className="w-5 h-5" />, group: "Intelligence" },
  { path: "/crm/calendar", label: "Global Calendar", labelGr: "Κεντρικό Ημερολόγιο", icon: <Calendar className="w-5 h-5" />, group: "Intelligence" },

  { path: "/admin/manager-crm/reports", label: "CRM Reports", labelGr: "Αναφορές CRM", icon: <FileText className="w-5 h-5" />, group: "Analytics" },
  { path: "/admin/manager-crm/advertising", label: "Advertising", labelGr: "Διαφημίσεις", icon: <BarChart className="w-5 h-5" />, group: "Analytics" },
  { path: "/admin/broadcast", label: "Broadcast", labelGr: "Μαζικές Ενημερώσεις", icon: <Bell className="w-5 h-5" />, group: "Marketing" },
  { path: "/admin/contact-messages", label: "Contact Messages", labelGr: "Μηνύματα Επικοινωνίας", icon: <MessageSquare className="w-5 h-5" />, group: "Marketing" },
  { path: "/crm/facebook-integration", label: "Facebook Integration", labelGr: "Σύνδεση με Facebook", icon: <Repeat className="w-5 h-5" />, group: "Marketing" },

  { path: "/admin/manager-crm/access", label: "Access Control", labelGr: "Διαχείριση Πρόσβασης", icon: <Shield className="w-5 h-5" />, group: "Management" },
  { path: "/admin/manager-crm/no-show-alerts", label: "No-Show Alerts", labelGr: "Ειδοποιήσεις μη προσέλευσης", icon: <Eye className="w-5 h-5" />, group: "Management" },

  { path: "/admin/payments", label: "Payments & Financials", labelGr: "Πληρωμές & Οικονομική Διαχείριση", icon: <DollarSign className="w-5 h-5" />, group: "Finance" },
  { path: "/admin/gift-cards", label: "Gift Cards", labelGr: "Δωροκάρτες", icon: <Tag className="w-5 h-5" />, group: "Finance" },
  { path: "/admin/wallet", label: "Loyalty & Wallet", labelGr: "Πρόγραμμα Επιβράβευσης & Πορτοφόλι", icon: <ClipboardList className="w-5 h-5" />, group: "Finance" },

  { path: "/admin/reviews", label: "Review Moderation", labelGr: "Διαχείριση Αξιολογήσεων", icon: <Eye className="w-5 h-5" />, group: "Content" },
  { path: "/admin/treatments", label: "Therapy Catalog", labelGr: "Κατάλογος Θεραπειών", icon: <ListChecks className="w-5 h-5" />, group: "Content" },
  { path: "/admin/blog", label: "Blog & Content", labelGr: "Άρθρα & Περιεχόμενο", icon: <FileText className="w-5 h-5" />, group: "Content" },

  { path: "/admin/integrations", label: "Integrations", labelGr: "Διασυνδέσεις", icon: <Settings className="w-5 h-5" />, group: "System" },
  { path: "/admin/system-lists", label: "System-wide Lists", labelGr: "Κεντρικές Λίστες", icon: <ListChecks className="w-5 h-5" />, group: "System" },
  { path: "/admin/notification-settings", label: "Notification Settings", labelGr: "Ρυθμίσεις Ειδοποιήσεων", icon: <Bell className="w-5 h-5" />, group: "System" },
  { path: "/admin/audit-logs", label: "Audit Logs", labelGr: "Αρχείο Καταγραφής Ενεργειών", icon: <Shield className="w-5 h-5" />, group: "System" },
  { path: "/change-password", label: "Change Password", labelGr: "Αλλαγή κωδικού", icon: <Key className="w-5 h-5" />, group: "System" },
];

const getAdminLinks = (role: string): SidebarItem[] => {
 if (role === 'SUPER_ADMIN' || role === 'manager') {
 // The contact-form inbox is admin only
 return role === 'manager' ? managerLinks.filter(l => l.path !== '/admin/contact-messages') : managerLinks;
 }

 // Fallback for regular `admin` 
 return [
 { path:"/admin/dashboard", label:"Overview", icon: <LayoutDashboard className="w-5 h-5" />, group:"Main" },
 { path:"/messages", label:"Messages", icon: <MessageSquare className="w-5 h-5" />, group:"Communication" },
 { path:"/admin/clinics", label:"Clinics", icon: <Building2 className="w-5 h-5" />, group:"Main" },
 { path:"/admin/users", label:"Users & Roles", icon: <Users className="w-5 h-5" />, group:"Main" },
 { path:"/admin/reviews", label:"Review Moderation", icon: <Eye className="w-5 h-5" />, group:"Approvals" },
 { path:"/admin/treatments", label:"Therapy Catalog", icon: <ListChecks className="w-5 h-5" />, group:"Approvals" },
 { path:"/admin/payments", label:"Payments & Turnover", icon: <DollarSign className="w-5 h-5" />, group:"Finance" },
 { path:"/admin/gift-cards", label:"Gift Cards", icon: <Tag className="w-5 h-5" />, group:"Finance" },
 { path:"/crm/analytics", label:"Sales Analytics", icon: <BarChart2 className="w-5 h-5" />, group:"Intelligence" },
 { path:"/admin/clinic-analytics", label:"Clinic Analytics", icon: <Building2 className="w-5 h-5" />, group:"Intelligence" },
 { path:"/admin/broadcast", label:"Broadcast", icon: <Bell className="w-5 h-5" />, group:"Communication" },
 { path:"/admin/contact-messages", label:"Contact Messages", icon: <MessageSquare className="w-5 h-5" />, group:"Communication" },
 { path:"/admin/notification-settings", label:"Notification Settings", icon: <Bell className="w-5 h-5" />, group:"System" },
 { path:"/admin/system-lists", label:"System Lists", icon: <ListChecks className="w-5 h-5" />, group:"System" },
 { path:"/admin/audit-logs", label:"Audit Logs", icon: <Shield className="w-5 h-5" />, group:"System" },
 { path:"/change-password", label:"Change Password", icon: <Key className="w-5 h-5" />, group:"System" },
 ];
};

interface SidebarProps {
 onNavigate?: () => void;
 isCollapsed?: boolean;
 onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, isCollapsed = false, onToggleCollapse }) => {
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

  const [currentLang, setCurrentLang] = React.useState<'en' | 'el'>(
    (localStorage.getItem('preferredLang') as 'en' | 'el') || 'en'
  );

  const handleLanguageSwitch = (lang: 'en' | 'el') => {
    setCurrentLang(lang);
    (window as any).switchLanguage?.(lang);
  };

 const handleLogout = async () => {
 await dispatch(logout());
 navigate("/login");
 };
 const role = (user?.role as string) ||"";
 const normalizedRole = role.toLowerCase();

 const links =
 normalizedRole ==="client"
 ? clientLinks
 : normalizedRole ==="clinic_owner" || normalizedRole ==="secretariat" || normalizedRole ==="doctor"
 ? clinicLinks
 : normalizedRole ==="admin" || normalizedRole ==="super_admin"
 ? getAdminLinks(role)
 : normalizedRole ==="salesperson" || normalizedRole ==="sales_person"
 ? crmLinks
 : normalizedRole ==="manager"
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
  <aside className={`${isCollapsed ? 'w-16 lg:w-[68px]' : 'w-64 lg:w-72'} bg-white text-gray-900 flex flex-col border-r border-gray-100 shadow-sm h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out`}>
  {/* Header */}
  <div className={`border-b border-gray-100 bg-gradient-to-tr from-white to-gray-50/50 flex items-center transition-all ${
    isCollapsed ? 'p-3 flex-col gap-2' : 'p-4 justify-between'
  }`}>
    <Link to={getHomePath(role)} className="flex items-center gap-3 min-w-0 group" title={`${user?.firstName} ${user?.lastName} (${role.replace('_', ' ')})`}>
      <div className="size-10 bg-black rounded-xl flex items-center justify-center text-[#CBFF38] shadow-md shadow-lime-500/10 font-black text-lg border border-white/10 group-hover:rotate-6 transition-transform notranslate shrink-0">
        {user?.firstName?.substring(0, 1).toUpperCase() || 'U'}
      </div>
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-black uppercase tracking-tight leading-tight truncate notranslate">
            {user?.firstName} {user?.lastName}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="size-1.5 bg-[#CBFF38] rounded-full animate-pulse shadow-[0_0_5px_#CBFF38]" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">
              {role.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}
    </Link>

    {/* Toggle Collapse Button for Desktop */}
    {onToggleCollapse && (
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex size-7 rounded-lg bg-gray-50 hover:bg-black hover:text-[#CBFF38] text-gray-400 items-center justify-center transition-colors shrink-0 shadow-xs"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    )}
  </div>

  <nav className={`flex-1 overflow-y-auto py-4 custom-scrollbar space-y-4 ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
  {Object.entries(groupedLinks).map(([group, groupLinks]) => (
    <div key={group}>
      {group !== 'General' && !isCollapsed && (
        <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 mb-2">
          {group}
        </h3>
      )}
      <ul className="space-y-1">
        {groupLinks.map((link) => {
          const isActive = link.path.includes('?')
            ? location.pathname + (location.search || '') === link.path
            : location.pathname === link.path;
          const label = (currentLang === 'el' && link.labelGr) ? link.labelGr : link.label;

          return (
            <li key={link.path}>
              <Link
                to={link.path}
                title={label}
                onClick={(e) => {
                  if (onNavigate) onNavigate();
                  const restrictedPaths = ['/clinic/dashboard', '/clinic/analytics', '/clinic/staff', '/clinic/settings'];
                  const isRestrictedRole = role === 'doctor' || role === 'secretariat';
                  if (isRestrictedRole && restrictedPaths.includes(link.path)) {
                    e.preventDefault();
                    return;
                  }
                }}
                className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'text-black bg-[#CBFF38] shadow-sm font-black'
                    : 'text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
              >
                <div className={`transition-transform duration-300 relative shrink-0 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                  {React.cloneElement(link.icon as React.ReactElement, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
                  {isCollapsed && link.path === '/messages' && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-black ring-2 ring-[#CBFF38]" />
                  )}
                  {isCollapsed && link.path === '/clinic/my-notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-black ring-2 ring-[#CBFF38]" />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span className={`text-[10px] font-black uppercase tracking-wider flex-1 truncate ${isActive ? 'text-black' : 'text-gray-600 group-hover:text-black'}`}>
                      {label}
                    </span>

                    {link.path === '/messages' && totalUnread > 0 && (
                      <div className="bg-black text-[#CBFF38] text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </div>
                    )}

                    {link.path === '/clinic/my-notifications' && unreadCount > 0 && (
                      <div className="bg-black text-[#CBFF38] text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  ))}
  </nav>

  {/* Footer */}
  <div className={`border-t border-gray-100 bg-white flex flex-col gap-2 shrink-0 ${isCollapsed ? 'p-2 items-center' : 'p-3'}`}>
    {isCollapsed ? (
      <>
        {/* Mini language switcher */}
        <button
          onClick={() => handleLanguageSwitch(currentLang === 'en' ? 'el' : 'en')}
          className="size-8 rounded-lg bg-gray-50 border border-gray-200 text-[9px] font-black uppercase text-gray-700 hover:bg-[#CBFF38] hover:text-black transition-all flex items-center justify-center shadow-xs"
          title={`Language: ${currentLang.toUpperCase()} (Click to toggle)`}
        >
          {currentLang.toUpperCase()}
        </button>

        {/* Settings icon button */}
        <button
          onClick={() => {
            const routes: Record<string, string> = {
              'salesperson': '/crm/settings',
              'clinic_owner': '/clinic/settings',
              'manager': '/crm/settings',
              'admin': '/crm/settings',
              'super_admin': '/crm/settings',
              'doctor': '/change-password',
              'secretariat': '/change-password',
              'client': '/settings'
            };
            if (routes[role]) navigate(routes[role]);
            else navigate('/crm/settings');
          }}
          className="size-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center hover:bg-black hover:text-[#CBFF38] transition-all border border-gray-100 shadow-xs"
          title="Account Settings"
        >
          <Settings size={16} />
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="size-8 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-100 transition-all shadow-xs"
        >
          <LogOut size={16} />
        </button>
      </>
    ) : (
      <>
        {/* Language Switcher for SuperAdmin / Admin / Clinic / CRM / Staff */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Language</span>
          <div className="flex items-center rounded-md overflow-hidden border border-gray-200 bg-white shadow-xs">
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

        <div className="flex gap-2">
          <button
            onClick={() => {
              const routes: Record<string, string> = {
                'salesperson': '/crm/settings',
                'clinic_owner': '/clinic/settings',
                'manager': '/crm/settings',
                'admin': '/crm/settings',
                'super_admin': '/crm/settings',
                'doctor': '/change-password',
                'secretariat': '/change-password',
                'client': '/settings'
              };
              if (routes[role]) navigate(routes[role]);
              else navigate('/crm/settings');
            }}
            className="size-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-black hover:text-[#CBFF38] transition-all border border-gray-100 shadow-xs active:scale-95 group shrink-0"
            title="Account Settings"
          >
            <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 h-9 flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl font-black uppercase tracking-wider text-[9px] hover:bg-red-600 transition-all shadow-md shadow-red-500/20 active:scale-95 group"
          >
            <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
          </button>
        </div>
      </>
    )}
  </div>
 </aside>
 );
};
