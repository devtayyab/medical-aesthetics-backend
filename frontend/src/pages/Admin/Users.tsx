import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AccessControl } from "@/components/organisms/AccessControl";
import { fetchUsers, updateUserRole } from "@/store/slices/adminSlice";
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

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <AccessControl users={users} onUpdateRole={handleUpdateRole} />
      </div>
    </div>
  );
};
