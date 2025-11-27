import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface SidebarItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
  roles?: string[];
}

const clientLinks: SidebarItem[] = [
  { path: "/search", label: "Search" },
  { path: "/appointments", label: "Appointments" },
  { path: "/history", label: "History" },
  { path: "/reviews", label: "Reviews" },
  { path: "/loyalty", label: "Loyalty" },
];

const clinicLinks: SidebarItem[] = [
  { path: "/clinic/profile", label: "Profile" },
  { path: "/clinic/diary", label: "Diary" },
  { path: "/clinic/availability", label: "Availability" },
  { path: "/clinic/execution", label: "Execution" },
  { path: "/clinic/reports", label: "Reports" },
];

const crmLinks: SidebarItem[] = [
  { path: "/crm/customers", label: "Customers" },
  { path: "/crm/tasks", label: "Tasks" },
  { path: "/crm/actions", label: "Actions" },
  { path: "/crm/repeat-management", label: "Repeat Management" },
];

const adminLinks: SidebarItem[] = [
  { 
    path: "/admin/dashboard", 
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    )
  },
  { 
    path: "/admin/manager-dashboard", 
    label: "Manager Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    )
  },
  { 
    path: "/admin/users", 
    label: "Users",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    )
  },
  { 
    path: "/admin/loyalty-management", 
    label: "Loyalty Management",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    )
  },
  { 
    path: "/admin/monitor", 
    label: "Monitor",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role || "";

  const getLinksForRole = () => {
    switch (role) {
      case "client":
        return clientLinks;
      case "clinic_owner":
        return clinicLinks;
      case "admin":
      case "SUPER_ADMIN":
        return adminLinks;
      case "salesperson":
        return crmLinks;
      default:
        return [];
    }
  };

  const links = getLinksForRole();

  if (!role) return null;

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 pt-16">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {role === "client" ? "Client" : role === "clinic_owner" ? "Clinic" : role === "salesperson" ? "CRM" : "Admin"} Menu
        </h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {link.icon && <span className="mr-3">{link.icon}</span>}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
