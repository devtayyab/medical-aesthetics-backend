import React from "react";
import { Sidebar } from "@/components/organisms/Sidebar";

type Props = { children: React.ReactNode };

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
