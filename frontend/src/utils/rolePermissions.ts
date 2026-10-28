import { UserRole } from '../types/clinic.types';

export const permissions = {
 // Profile Management
 canEditProfile: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT],
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
 canManageServices: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT],
 canViewServices: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.MANAGER],

 // Appointments
 canConfirmAppointments: [UserRole.ADMIN, UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT],
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
 canViewAnalytics: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER],

 // Notifications
 canSendNotifications: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT],
 canSendBulkNotifications: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT],

 // Reviews
 canManageReviews: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT],
 canViewReviews: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT],

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
 canManageStaff: [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.ADMIN],

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
 UserRole.SALESPERSON,
 UserRole.MANAGER,
 ].includes(userRole as UserRole);
};

// Get available menu items based on role
export const getMenuItemsForRole = (userRole: UserRole | string) => {
  const menuItems: Array<{ id: string; label: string; labelGr: string; path: string; icon: string }> = [];

  // Dashboard - available to all clinic roles
  menuItems.push({
    id: 'dashboard',
    label: 'Dashboard',
    labelGr: 'Πίνακας ελέγχου',
    path: '/clinic/dashboard',
    icon: 'LayoutDashboard',
  });

  // Appointments - available to all
  if (hasPermission(userRole, 'canViewAppointments')) {
    menuItems.push({
      id: 'appointments',
      label: 'Appointments',
      labelGr: 'Ραντεβού',
      path: '/clinic/appointments',
      icon: 'Calendar',
    });
  }

  // Availability Settings - for clinic owner and secretariat
  if (hasPermission(userRole, 'canManageAvailability')) {
    menuItems.push({
      id: 'availability',
      label: 'Availability Settings',
      labelGr: 'Ρυθμίσεις διαθεσιμότητας',
      path: '/clinic/availability-settings',
      icon: 'Clock',
    });
  }

  // Patients (was Clients) - available to all
  if (hasPermission(userRole, 'canViewClients')) {
    menuItems.push({
      id: 'clients',
      label: 'Patients',
      labelGr: 'Ασθενείς',
      path: '/clinic/clients',
      icon: 'Users',
    });
  }

  // Messages - available to all clinic roles
  if (hasPermission(userRole, 'canViewMessages')) {
    menuItems.push({
      id: 'messages',
      label: 'Messages',
      labelGr: 'Μηνύματα',
      path: '/clinic/messages',
      icon: 'MessageSquare',
    });
  }

  // Calendar (was Diary)
  if (hasPermission(userRole, 'canViewAppointments')) {
    menuItems.push({
      id: 'diary',
      label: 'Calendar',
      labelGr: 'Ημερολόγιο',
      path: '/clinic/diary',
      icon: 'BookOpen',
    });
  }

  // Treatments & Pricing
  if (hasPermission(userRole, 'canViewServices')) {
    menuItems.push({
      id: 'services',
      label: 'Treatments & Pricing',
      labelGr: 'Θεραπείες & Τιμές',
      path: '/clinic/services',
      icon: 'Package',
    });
  }

  // Analytics & Reports
  if (hasPermission(userRole, 'canViewAnalytics')) {
    menuItems.push({
      id: 'analytics',
      label: 'Analytics & Reports',
      labelGr: 'Στατιστικά & Αναφορές',
      path: '/clinic/analytics',
      icon: 'BarChart3',
    });
  }

  // Reviews
  if (hasPermission(userRole, 'canViewReviews')) {
    menuItems.push({
      id: 'reviews',
      label: 'Reviews',
      labelGr: 'Αξιολογήσεις',
      path: '/clinic/reviews',
      icon: 'Star',
    });
  }

  // Notifications
  menuItems.push({
    id: 'my-notifications',
    label: 'Notifications',
    labelGr: 'Ειδοποιήσεις',
    path: '/clinic/my-notifications',
    icon: 'Bell',
  });

  // Patient Communications (was Campaign Outreach)
  if (hasPermission(userRole, 'canSendNotifications')) {
    menuItems.push({
      id: 'notifications',
      label: 'Patient Communications',
      labelGr: 'Ενημέρωση Ασθενών',
      path: '/clinic/notifications',
      icon: 'Phone',
    });
  }

  // Staff Management
  if (hasPermission(userRole, 'canManageStaff')) {
    menuItems.push({
      id: 'staff',
      label: 'Staff Management',
      labelGr: 'Διαχείριση Προσωπικού',
      path: '/clinic/staff',
      icon: 'UserCog',
    });
  }

  // Clinic Settings (was Settings)
  if (hasPermission(userRole, 'canEditProfile')) {
    menuItems.push({
      id: 'settings',
      label: 'Clinic Settings',
      labelGr: 'Ρυθμίσεις Κλινικής',
      path: '/clinic/settings',
      icon: 'Settings',
    });
  }

  // Google Calendar connection - clinic owner, doctor, secretariat
  if (hasPermission(userRole, 'canEditProfile')) {
    menuItems.push({
      id: 'google-calendar',
      label: 'Google Calendar',
      labelGr: 'Google Calendar',
      path: '/clinic/google-calendar',
      icon: 'Calendar',
    });
  }

  // Final fallback
  if (userRole === UserRole.CLINIC_OWNER || userRole === UserRole.DOCTOR || userRole === UserRole.SECRETARIAT || userRole === 'clinic_owner' || userRole === 'doctor' || userRole === 'secretariat') {
    if (!menuItems.find(m => m.id === 'messages')) {
      menuItems.push({ id: 'messages', label: 'Messages', labelGr: 'Μηνύματα', path: '/clinic/messages', icon: 'MessageSquare' });
    }
    if (!menuItems.find(m => m.id === 'staff')) {
      menuItems.push({ id: 'staff', label: 'Staff Management', labelGr: 'Διαχείριση Προσωπικού', path: '/clinic/staff', icon: 'UserCog' });
    }
    if (!menuItems.find(m => m.id === 'diary')) {
      menuItems.push({ id: 'diary', label: 'Calendar', labelGr: 'Ημερολόγιο', path: '/clinic/diary', icon: 'BookOpen' });
    }
    if (!menuItems.find(m => m.id === 'services')) {
      menuItems.push({ id: 'services', label: 'Treatments & Pricing', labelGr: 'Θεραπείες & Τιμές', path: '/clinic/services', icon: 'Package' });
    }
  }

  return menuItems;
}
