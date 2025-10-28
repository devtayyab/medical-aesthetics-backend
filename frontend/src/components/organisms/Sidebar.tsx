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
  { path: "/crm/form-stats", label: "📊 Form Statistics" },
];

const adminLinks: SidebarItem[] = [
  { path: "/admin/dashboard", label: "Dashboard" },
  { path: "/admin/users", label: "Users" },
  { path: "/admin/loyalty-management", label: "Loyalty Management" },
  { path: "/admin/monitor", label: "Monitor" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role || "";

  console.log("🔍 Sidebar Debug:", { role, user });

  let links: SidebarItem[] = [];

  if (role === "client") {
    links = clientLinks;
  } else if (role === "clinic_owner" || role === "doctor" || role === "secretariat") {
    links = clinicLinks;
  } else if (role === "salesperson") {
    links = crmLinks;
    console.log("✅ CRM Links Selected:", crmLinks);
  } else if (role === "admin") {
    links = adminLinks;
  }

  return (
    <aside className="w-64 bg-gray-100 h-screen p-4 border">
      <div className="flex flex-col gap-2">
        {/* Debug Info */}
        <div className="text-xs text-gray-500 mb-2 p-2 bg-yellow-100 rounded">
          Role: <strong>{role}</strong>
          <br />
          Links: {links.length}
        </div>

        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`p-2 rounded ${location.pathname === link.path
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
