import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export const RoleDebugger: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50 max-w-xs">
      <h3 className="font-bold text-yellow-400 mb-2">🐛 Debug Info</h3>
      <div className="text-xs space-y-1">
        <p><strong>User:</strong> {user?.email || "Not logged in"}</p>
        <p><strong>Role:</strong> <span className="text-green-400">{user?.role || "NONE"}</span></p>
        <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>ID:</strong> {user?.id || "N/A"}</p>
      </div>
    </div>
  );
};
