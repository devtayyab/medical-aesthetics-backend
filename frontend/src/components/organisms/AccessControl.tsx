import React from "react";
import type { User } from "@/types";

interface AccessControlProps {
  users: User[];
  onUpdateRole: (id: string, role: string) => void;
  onToggleStatus: (id: string) => void;
}

export const AccessControl: React.FC<AccessControlProps> = ({
  users,
  onUpdateRole,
  onToggleStatus,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.isArray(users) && users.map((user) => (
        <div key={user.id} className="flex items-center gap-4 p-2 border-b">
          <p className="flex-1">
            {user.firstName} {user.lastName} ({user.email})
          </p>
          <select
            value={user.role}
            onChange={(e) => onUpdateRole(user.id, e.target.value)}
            className="border rounded p-1"
          >
            <option value="client">Client</option>
            <option value="clinic">Clinic</option>
            <option value="salesperson">Salesperson</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => onToggleStatus(user.id)}
            className={`px-3 py-1 rounded text-white min-w-[80px] ${user.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
              }`}
          >
            {user.isActive ? "Active" : "Inactive"}
          </button>

        </div>
      ))}
    </div>
  );
};
