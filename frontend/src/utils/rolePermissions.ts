import { UserRole } from '../types/clinic.types';

export const permissions = {
  // Profile Management
  canEditProfile: [UserRole.CLINIC_OWNER],
  canViewProfile: [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.CLINIC_OWNER,
    UserRole.DOCTOR,
    UserRole.SECRETARIAT,
    UserRole.SALESPERSON,
    UserRole.MANAGER,
  ],

  // Services/Treatments
  canManageServices: [UserRole.CLINIC_OWNER],
  canViewServices: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.MANAGER],

  // Appointments
  canConfirmAppointments: [UserRole.ADMIN, UserRole.SALESPERSON],
  canMarkNoShow: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.ADMIN, UserRole.SALESPERSON],
  canRescheduleAppointments: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.ADMIN, UserRole.SALESPERSON],
  canCompleteAppointments: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.ADMIN, UserRole.SALESPERSON],
  canViewAppointments: [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.CLINIC_OWNER,
    UserRole.DOCTOR,
    UserRole.SECRETARIAT,
    UserRole.SALESPERSON,
    UserRole.MANAGER,
  ],

  // Payments
  canRecordPayments: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT],
  canViewPayments: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.MANAGER],

  // Analytics
  canViewAnalytics: [UserRole.CLINIC_OWNER, UserRole.SALESPERSON, UserRole.MANAGER],

  // Notifications
  canSendNotifications: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT],
  canSendBulkNotifications: [UserRole.CLINIC_OWNER],

  // Reviews
  canManageReviews: [UserRole.CLINIC_OWNER],
  canViewReviews: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT],

  // Clients
  canViewClients: [
    UserRole.CLINIC_OWNER,
    UserRole.DOCTOR,
    UserRole.SECRETARIAT,
    UserRole.SALESPERSON,
    UserRole.MANAGER,
  ],

  // Availability
  canManageAvailability: [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.MANAGER],

  // Staff Management
  canManageStaff: [UserRole.CLINIC_OWNER, UserRole.ADMIN],

  // Messages
  canViewMessages: [
    UserRole.CLINIC_OWNER,
    UserRole.DOCTOR,
    UserRole.SECRETARIAT,
    UserRole.SALESPERSON,
    UserRole.MANAGER,
  ],
};

export const hasPermission = (
  userRole?: UserRole | string,
  permission?: keyof typeof permissions
): boolean => {
  if (!userRole || !permission) return false;
  return permissions[permission].includes(userRole as UserRole);
};

export const canAccessClinicDashboard = (userRole: UserRole | string): boolean => {
  return [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.CLINIC_OWNER,
    UserRole.DOCTOR,
    UserRole.SECRETARIAT,
    UserRole.SALESPERSON,
    UserRole.MANAGER,
  ].includes(userRole as UserRole);
};

// Get available menu items based on role
export const getMenuItemsForRole = (userRole: UserRole | string) => {
  const menuItems = [];

  // Dashboard - available to all clinic roles
  menuItems.push({
    id: 'dashboard',
    label: 'Dashboard',
    path: '/clinic/dashboard',
    icon: 'LayoutDashboard',
  });

  // Appointments - available to all
  if (hasPermission(userRole, 'canViewAppointments')) {
    menuItems.push({
      id: 'appointments',
      label: 'Appointments',
      path: '/clinic/appointments',
      icon: 'Calendar',
    });
  }

  // Availability Settings - for clinic owner and secretariat
  if (hasPermission(userRole, 'canManageAvailability')) {
    menuItems.push({
      id: 'availability',
      label: 'Availability Settings',
      path: '/clinic/availability-settings',
      icon: 'Clock',
    });
  }

  // Clients - available to all
  if (hasPermission(userRole, 'canViewClients')) {
    menuItems.push({
      id: 'clients',
      label: 'Clients',
      path: '/clinic/clients',
      icon: 'Users',
    });
  }

  // Messages - available to all clinic roles
  if (hasPermission(userRole, 'canViewMessages')) {
    menuItems.push({
      id: 'messages',
      label: 'Messages',
      path: '/clinic/messages',
      icon: 'MessageSquare',
    });
  }

  // Clinic Diary (Appointment Diary)
  if (hasPermission(userRole, 'canViewAppointments')) {
    menuItems.push({
      id: 'diary',
      label: 'Diary',
      path: '/clinic/diary',
      icon: 'BookOpen',
    });
  }

  // Services - only for clinic owner and secretariat
  if (hasPermission(userRole, 'canViewServices')) {
    menuItems.push({
      id: 'services',
      label: 'Services & Pricing',
      path: '/clinic/services',
      icon: 'Package',
    });
  }

  // Analytics - only for clinic owner and salesperson
  if (hasPermission(userRole, 'canViewAnalytics')) {
    menuItems.push({
      id: 'analytics',
      label: 'Analytics & Reports',
      path: '/clinic/analytics',
      icon: 'BarChart3',
    });
  }

  // Reviews - only for clinic owner
  if (hasPermission(userRole, 'canViewReviews')) {
    menuItems.push({
      id: 'reviews',
      label: 'Reviews',
      path: '/clinic/reviews',
      icon: 'Star',
    });
  }

  // Notifications - for clinic owner and secretariat
  if (hasPermission(userRole, 'canSendNotifications')) {
    menuItems.push({
      id: 'notifications',
      label: 'Notifications',
      path: '/clinic/notifications',
      icon: 'Bell',
    });
  }

  // Staff Management - only for owner and admin
  if (hasPermission(userRole, 'canManageStaff')) {
    menuItems.push({
      id: 'staff',
      label: 'Staff Management',
      path: '/clinic/staff',
      icon: 'UserCog',
    });
  }

  // Settings - only for clinic owner
  if (hasPermission(userRole, 'canEditProfile')) {
    menuItems.push({
      id: 'settings',
      label: 'Settings',
      path: '/clinic/settings',
      icon: 'Settings',
    });
  }

  // Final fallback for clinic_owner to ensure nothing is missed
  if (userRole === UserRole.CLINIC_OWNER || userRole === 'clinic_owner') {
    if (!menuItems.find(m => m.id === 'messages')) {
      menuItems.push({ id: 'messages', label: 'Messages', path: '/clinic/messages', icon: 'MessageSquare' });
    }
    if (!menuItems.find(m => m.id === 'staff')) {
      menuItems.push({ id: 'staff', label: 'Staff Management', path: '/clinic/staff', icon: 'UserCog' });
    }
    if (!menuItems.find(m => m.id === 'diary')) {
      menuItems.push({ id: 'diary', label: 'Diary', path: '/clinic/diary', icon: 'BookOpen' });
    }
  }

  return menuItems;
}
