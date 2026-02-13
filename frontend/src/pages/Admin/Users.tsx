import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AccessControl } from "@/components/organisms/AccessControl";
import { fetchUsers, updateUserRole, toggleUserStatus } from "@/store/slices/adminSlice";
import type { RootState, AppDispatch } from "@/store";
import type { User } from "@/types";
import { Sidebar } from "@/components/organisms/Sidebar";

export const Users: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleUpdateRole = (id: string, role: string) => {
    dispatch(updateUserRole({ id, role }));
  };

  const handleToggleStatus = (id: string) => {
    dispatch(toggleUserStatus(id));
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <AccessControl
        users={users}
        onUpdateRole={handleUpdateRole}
        onToggleStatus={handleToggleStatus}
      />
    </>
  );
};
