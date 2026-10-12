import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout as logoutAction } from '@/store/slices/authSlice';
import type { UserRole } from '@/types/clinic.types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const role = user?.role;

  const hasRole = (roles: (UserRole | string)[]) => {
    if (!role) return false;
    return roles.includes(role);
  };

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isClinicOwner = role === 'clinic_owner';
  const isDoctor = role === 'doctor';
  const isSalesperson = role === 'salesperson';
  const isSecretariat = role === 'secretariat';
  const isClient = role === 'client';

  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    error,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isClinicOwner,
    isDoctor,
    isSalesperson,
    isSecretariat,
    isClient,
    logout,
  };
};

export default useAuth;
