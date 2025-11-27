import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface SidebarItem {
  path: string;
  label: string;
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

const getAdminLinks = (role: string): SidebarItem[] => {
  const baseLinks = [
    { path: "/admin/users", label: "Users" },
    { path: "/admin/loyalty-management", label: "Loyalty Management" },
    { path: "/admin/monitor", label: "Monitor" },
  ];

  if (role === 'SUPER_ADMIN') {
    return [
      { path: "/admin/manager-dashboard", label: "Manager Dashboard" },
      ...baseLinks,
    ];
  }
  
  return [
    { path: "/admin/dashboard", label: "Dashboard" },
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

  return (
    <aside className="w-64 bg-gray-100 h-screen p-4 border">
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`p-2 rounded ${
              location.pathname === link.path
                ? "bg-[#CBFF38] text-black"
                : "hover:bg-gray-200"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  );
};
