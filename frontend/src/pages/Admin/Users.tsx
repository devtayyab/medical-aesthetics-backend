import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from"react-redux";
import { AccessControl } from"@/components/organisms/AccessControl";
import { fetchUsers, updateUserDetails, createNewUser } from"@/store/slices/adminSlice";
import toast from"react-hot-toast";
import type { RootState, AppDispatch } from"@/store";
import type { Clinic, User } from"@/types";
import { adminAPI } from"@/services/api";

interface StaffRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  clinic?: { id: string; name: string } | null;
  requestedBy?: string | null;
  requestedAt?: string;
}

// Roles that can take over leads and tasks of a deactivated user.
const ASSIGNABLE_ROLES = ["salesperson","manager","admin","SUPER_ADMIN"];

const formatDate = (value?: string) => {
  if (!value) return"";
  try {
    return new Date(value).toLocaleString("el-GR", { timeZone:"Europe/Athens", day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", hour12: false });
  } catch {
    return value;
  }
};

export const Users: React.FC = () => {
  const [isGreek, setIsGreek] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    window.addEventListener('languagechange', handleLang);
    return () => {
      window.removeEventListener('storage', handleLang);
      window.removeEventListener('languagechange', handleLang);
    };
  }, []);
  const t = (gr: string, en: string) => (isGreek ? gr : en);

 const dispatch = useDispatch<AppDispatch>();
 const { users, isLoading, error } = useSelector(
 (state: RootState) => state.admin
 );
 const [clinics, setClinics] = React.useState<Clinic[]>([]);
 const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);

 // Deactivate dialog (item 48)
 const [deactivating, setDeactivating] = useState<User | null>(null);
 const [openWork, setOpenWork] = useState<{ leads: number; tasks: number } | null>(null);
 const [reassignTo, setReassignTo] = useState("");
 const [isSaving, setIsSaving] = useState(false);

 const loadStaffRequests = useCallback(() => {
 adminAPI.getStaffRequests()
 .then((res) => setStaffRequests(res.data || []))
 .catch(() => setStaffRequests([]));
 }, []);

 useEffect(() => {
 dispatch(fetchUsers());
 loadStaffRequests();

 // Fetch clinics for the staff assignment mapping
 adminAPI.getClinics().then((res) => {
 setClinics(res.data.clinics || []);
 }).catch(err => {
 console.error("Failed to load clinics", err);
 });
 }, [dispatch, loadStaffRequests]);

 const handleUpdateRole = (id: string, data: { role?: string; monthlyTarget?: number; assignedClinicIds?: string[] }) => {
 dispatch(updateUserDetails({ id, ...data }));
 };

 const handleToggleStatus = async (id: string) => {
 const target = users.find((u) => u.id === id);
 if (!target) return;
 if (!target.isActive) {
 try {
 await adminAPI.reactivateUser(id);
 toast.success(t("Ο χρήστης ενεργοποιήθηκε","User reactivated"));
 dispatch(fetchUsers());
 } catch (err: any) {
 toast.error(err?.response?.data?.message || t("Αποτυχία","Failed"));
 }
 return;
 }
 setDeactivating(target);
 setReassignTo("");
 setOpenWork(null);
 try {
 const res = await adminAPI.getUserOpenWork(id);
 setOpenWork(res.data);
 } catch {
 setOpenWork({ leads: 0, tasks: 0 });
 }
 };

 const confirmDeactivate = async () => {
 if (!deactivating) return;
 const needsTarget = !!openWork && openWork.leads + openWork.tasks > 0;
 if (needsTarget && !reassignTo) {
 toast.error(t("Επιλέξτε ποιος αναλαμβάνει τα ανοιχτά leads και tasks","Choose who takes over the open leads and tasks"));
 return;
 }
 setIsSaving(true);
 try {
 await adminAPI.deactivateUser(deactivating.id, needsTarget ? reassignTo : undefined);
 toast.success(t("Ο χρήστης απενεργοποιήθηκε","User deactivated"));
 setDeactivating(null);
 dispatch(fetchUsers());
 } catch (err: any) {
 toast.error(err?.response?.data?.message || t("Αποτυχία","Failed"));
 } finally {
 setIsSaving(false);
 }
 };

 const handleStaffRequest = async (id: string, action:"approve" |"reject") => {
 try {
 if (action ==="approve") {
 await adminAPI.approveStaffRequest(id);
 toast.success(t("Εγκρίθηκε. Στάλθηκε email για ορισμό κωδικού.","Approved. A set-password email was sent."));
 } else {
 await adminAPI.rejectStaffRequest(id);
 toast.success(t("Το αίτημα απορρίφθηκε","Request rejected"));
 }
 loadStaffRequests();
 dispatch(fetchUsers());
 } catch (err: any) {
 toast.error(err?.response?.data?.message || t("Αποτυχία","Failed"));
 }
 };

 const handleCreateUser = async (data: any) => {
 try {
 await dispatch(createNewUser(data)).unwrap();
 toast.success(data.password ? "User created successfully!" :"User created. A set-password link was emailed.");
 } catch (err: any) {
 toast.error(err?.message ||"Failed to create user. Email might already exist.");
 throw err;
 }
 };

 const assignees = users.filter(
 (u) => u.isActive && ASSIGNABLE_ROLES.includes(u.role) && u.id !== deactivating?.id
 );

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="text-2xl font-bold text-gray-900">{isGreek ? 'Διαχείριση Χρηστών' : 'User Management'}</h2>
 <p className="text-gray-500">{isGreek ? 'Διαχείριση χρηστών, ρόλων και δικαιωμάτων' : 'Manage all system users, roles, and permissions'}</p>
 </div>
 </div>

 {staffRequests.length > 0 && (
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
 <h3 className="font-bold text-amber-900 mb-3">
 {t("Αιτήματα νέου προσωπικού από κλινικές","Staff requests from clinics")} ({staffRequests.length})
 </h3>
 <div className="space-y-2">
 {staffRequests.map((r) => (
 <div key={r.id} className="bg-white rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
 <div className="text-sm min-w-0">
 <div className="font-semibold text-gray-900 break-words">{r.firstName} {r.lastName} · {r.role}</div>
 <div className="text-gray-600 break-all">{r.email}{r.phone ? ` · ${r.phone}` :""}</div>
 <div className="text-gray-500">
 {r.clinic?.name || "-"}{r.requestedBy ? ` · ${t("από","by")} ${r.requestedBy}` :""} · {formatDate(r.requestedAt)}
 </div>
 </div>
 <div className="flex gap-2 shrink-0">
 <button onClick={() => handleStaffRequest(r.id,"approve")} className="px-3 py-1.5 rounded-lg bg-[#CBFF38] text-[#0B1120] text-sm font-bold">
 {t("Έγκριση","Approve")}
 </button>
 <button onClick={() => handleStaffRequest(r.id,"reject")} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
 {t("Απόρριψη","Reject")}
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {isLoading && <p className="text-center py-10 text-gray-500">Loading users...</p>}
 {error && <p className="p-4 bg-red-50 text-red-600 rounded-xl mb-4">{error}</p>}

 <AccessControl
 users={users}
 clinics={clinics}
 onUpdateUser={handleUpdateRole}
 onToggleStatus={handleToggleStatus}
 onCreateUser={handleCreateUser}
 />

 {deactivating && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[10000]">
 <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
 <h3 className="text-lg font-bold mb-2">
 {t("Απενεργοποίηση","Deactivate")} {deactivating.firstName} {deactivating.lastName}
 </h3>
 <p className="text-sm text-gray-600 mb-4">
 {t("Ο χρήστης δεν θα μπορεί να συνδεθεί (ισχύει αμέσως) και δεν θα εμφανίζεται στις λίστες ανάθεσης.","The user can no longer log in (effective immediately) and disappears from assignment lists.")}
 </p>
 {openWork === null ? (
 <p className="text-sm text-gray-500">{t("Φόρτωση...","Loading...")}</p>
 ) : openWork.leads + openWork.tasks > 0 ? (
 <div className="mb-4">
 <p className="text-sm text-gray-800 mb-2">
 {t(
 `Έχει ${openWork.leads} ανοιχτά leads και ${openWork.tasks} ανοιχτά tasks. Ποιος τα αναλαμβάνει;`,
 `Has ${openWork.leads} open leads and ${openWork.tasks} open tasks. Who takes them over?`
 )}
 </p>
 <select
 className="w-full border border-gray-300 rounded-lg p-2"
 value={reassignTo}
 onChange={(e) => setReassignTo(e.target.value)}
 >
 <option value="">{t("Επιλέξτε...","Choose...")}</option>
 {assignees.map((u) => (
 <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
 ))}
 </select>
 </div>
 ) : (
 <p className="text-sm text-gray-600 mb-4">{t("Δεν έχει ανοιχτά leads ή tasks.","No open leads or tasks.")}</p>
 )}
 <div className="flex justify-end gap-2">
 <button onClick={() => setDeactivating(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">
 {t("Άκυρο","Cancel")}
 </button>
 <button
 onClick={confirmDeactivate}
 disabled={isSaving || openWork === null}
 className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold disabled:opacity-50"
 >
 {t("Απενεργοποίηση","Deactivate")}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
