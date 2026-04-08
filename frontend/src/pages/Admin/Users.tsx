import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AccessControl } from "@/components/organisms/AccessControl";
import { fetchUsers, updateUserDetails, toggleUserStatus, createNewUser } from "@/store/slices/adminSlice";
import type { RootState, AppDispatch } from "@/store";
import type { Clinic } from "@/types";
import { adminAPI } from "@/services/api";

export const Users: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );
  const [clinics, setClinics] = React.useState<Clinic[]>([]);

  useEffect(() => {
    dispatch(fetchUsers());

    // Fetch clinics for the staff assignment mapping
    adminAPI.getClinics().then((res) => {
      setClinics(res.data.clinics || []);
    }).catch(err => {
      console.error("Failed to load clinics", err);
    });
  }, [dispatch]);

  const handleUpdateRole = (id: string, data: { role?: string; monthlyTarget?: number; assignedClinicIds?: string[] }) => {
    dispatch(updateUserDetails({ id, ...data }));
  };

  const handleToggleStatus = (id: string) => {
    dispatch(toggleUserStatus(id));
  };

  const handleCreateUser = (data: any) => {
    dispatch(createNewUser(data));
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500">Manage all system users, roles, and permissions</p>
        </div>
      </div>

      {isLoading && <p className="text-center py-10 text-gray-500">Loading users...</p>}
      {error && <p className="p-4 bg-red-50 text-red-600 rounded-xl mb-4">{error}</p>}

      <AccessControl
        users={users}
        clinics={clinics}
        onUpdateUser={handleUpdateRole}
        onToggleStatus={handleToggleStatus}
        onCreateUser={handleCreateUser}
      />
    </div>
  );
};
