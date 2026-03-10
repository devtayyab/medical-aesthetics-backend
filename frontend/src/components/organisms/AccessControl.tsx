import React, { useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import type { User, Clinic } from "@/types";

interface AccessControlProps {
  users: User[];
  clinics: Clinic[];
  onUpdateUser: (id: string, data: { role?: string; monthlyTarget?: number; assignedClinicIds?: string[] }) => void;
  onToggleStatus: (id: string) => void;
  onCreateUser?: (data: any) => void;
}

export const AccessControl: React.FC<AccessControlProps> = ({
  users,
  clinics,
  onUpdateUser,
  onToggleStatus,
  onCreateUser,
}) => {
  const [activeTab, setActiveTab] = useState("All");
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "client",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    role: string;
    monthlyTarget: string;
    assignedClinicIds: string[];
  }>({
    role: "",
    monthlyTarget: "",
    assignedClinicIds: [],
  });

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      monthlyTarget: user.monthlyTarget ? user.monthlyTarget.toString() : "",
      assignedClinicIds: user.assignedClinics ? user.assignedClinics.map(c => c.id) : [],
    });
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      onUpdateUser(editingUser.id, {
        role: editForm.role,
        monthlyTarget: editForm.role === "salesperson" && editForm.monthlyTarget ? Number(editForm.monthlyTarget) : undefined,
        assignedClinicIds: editForm.assignedClinicIds,
      });
      handleCloseEdit();
    }
  };

  const toggleClinicSelection = (clinicId: string) => {
    setEditForm(prev => ({
      ...prev,
      assignedClinicIds: prev.assignedClinicIds.includes(clinicId)
        ? prev.assignedClinicIds.filter(id => id !== clinicId)
        : [...prev.assignedClinicIds, clinicId]
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateUser) {
      onCreateUser(createForm);
      setIsCreating(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        role: "client",
      });
    }
  };

  const tabs = [
    { name: "All", roles: [] },
    { name: "Client", roles: ["client"] },
    { name: "Clinic Owner", roles: ["clinic_owner"] },
    { name: "Doctor", roles: ["doctor"] },
    { name: "Sales", roles: ["salesperson"] },
    { name: "Admin & Staff", roles: ["SUPER_ADMIN", "admin", "manager", "secretariat"] },
  ];

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    if (activeTab === "All") return true;
    const tabObj = tabs.find(t => t.name === activeTab);
    return tabObj && tabObj.roles.includes(user.role);
  }) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.name
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {onCreateUser && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CBFF38] text-[#0B1120] font-bold rounded-xl hover:bg-[#b0f020] shadow-md transition-all shrink-0"
          >
            + New User
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinics</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Target</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No users found in this category.
                </td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.assignedClinics?.length
                    ? (
                      <div className="flex flex-col gap-1">
                        {user.assignedClinics.map(c => (
                          <span key={c.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )
                    : <span className="text-gray-400">None</span>
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === 'salesperson' && user.monthlyTarget ? `€${user.monthlyTarget}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onToggleStatus(user.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Edit User Permissions</h3>
              <button onClick={handleCloseEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.role}
                  onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="clinic_owner">Clinic Owner</option>
                  <option value="doctor">Doctor</option>
                  <option value="secretariat">Secretariat</option>
                  <option value="salesperson">Salesperson</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {editForm.role === 'salesperson' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Sales Target (€)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 5000"
                    value={editForm.monthlyTarget}
                    onChange={e => setEditForm(prev => ({ ...prev, monthlyTarget: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Clinics (Staff Mapping)</label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                  {clinics?.map((clinic) => (
                    <label key={clinic.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-blue-500 focus:ring-blue-500"
                        checked={editForm.assignedClinicIds.includes(clinic.id)}
                        onChange={() => toggleClinicSelection(clinic.id)}
                      />
                      {clinic.name}
                    </label>
                  ))}
                  {(!clinics || clinics.length === 0) && (
                    <p className="text-sm text-gray-500">No clinics available.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button
                  onClick={handleCloseEdit}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B1120] text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Create New User</h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#CBFF38]"
                    value={createForm.firstName}
                    onChange={e => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#CBFF38]"
                    value={createForm.lastName}
                    onChange={e => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#CBFF38]"
                  value={createForm.email}
                  onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#CBFF38]"
                  value={createForm.password}
                  onChange={e => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#CBFF38]"
                  value={createForm.phone}
                  onChange={e => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-[#CBFF38]"
                  value={createForm.role}
                  onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="clinic_owner">Clinic Owner</option>
                  <option value="doctor">Doctor</option>
                  <option value="secretariat">Secretariat</option>
                  <option value="salesperson">Salesperson</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-[#CBFF38] text-[#0B1120] font-bold rounded-lg hover:bg-[#b0f020] transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

