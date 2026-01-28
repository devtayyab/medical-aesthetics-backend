import React from "react";
import { Button } from "@/components/atoms/Button/Button";
import type { User } from "@/types";

interface AccessControlProps {
  users: User[];
  onUpdateRole: (id: string, role: string) => void;
}

export const AccessControl: React.FC<AccessControlProps> = ({
  users,
  onUpdateRole,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.isArray(users) && users.map((user) => (
        <div key={user.id} className="flex items-center gap-4 p-2 border-b">
          <p>
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
        </div>
      ))}
    </div>
  );
};
