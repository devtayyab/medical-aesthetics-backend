import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import ClinicLayout from '../pages/Clinic/ClinicLayout';
import ClinicDashboard from '../pages/Clinic/ClinicDashboard';
import AppointmentsPage from '../pages/Clinic/AppointmentsPage';
import ServicesPage from '../pages/Clinic/ServicesPage';
import AvailabilityPage from '../pages/Clinic/AvailabilityPage';
import AnalyticsPage from '../pages/Clinic/AnalyticsPage';
import ClientsPage from '../pages/Clinic/ClientsPage';
import ReviewsPage from '../pages/Clinic/ReviewsPage';
import NotificationsPage from '../pages/Clinic/NotificationsPage';
import SettingsPage from '../pages/Clinic/SettingsPage';

// Protected Route Component
const ProtectedClinicRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const userRole = localStorage.getItem('userRole');

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const clinicRoutes: RouteObject[] = [
  {
    path: '/clinic',
    element: (
      <ProtectedClinicRoute
        allowedRoles={['clinic_owner', 'doctor', 'secretariat', 'salesperson']}
      >
        <ClinicLayout />
      </ProtectedClinicRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/clinic/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <ClinicDashboard />,
      },
      {
        path: 'appointments',
        element: <AppointmentsPage />,
      },
      {
        path: 'services',
        element: (
          <ProtectedClinicRoute allowedRoles={['clinic_owner', 'secretariat']}>
            <ServicesPage />
          </ProtectedClinicRoute>
        ),
      },
      {
        path: 'availability',
        element: (
          <ProtectedClinicRoute allowedRoles={['clinic_owner', 'secretariat']}>
            <AvailabilityPage />
          </ProtectedClinicRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedClinicRoute allowedRoles={['clinic_owner', 'salesperson']}>
            <AnalyticsPage />
          </ProtectedClinicRoute>
        ),
      },
      {
        path: 'clients',
        element: <ClientsPage />,
      },
      {
        path: 'reviews',
        element: (
          <ProtectedClinicRoute allowedRoles={['clinic_owner', 'secretariat']}>
            <ReviewsPage />
          </ProtectedClinicRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedClinicRoute allowedRoles={['clinic_owner', 'secretariat']}>
            <NotificationsPage />
          </ProtectedClinicRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedClinicRoute allowedRoles={['clinic_owner']}>
            <SettingsPage />
          </ProtectedClinicRoute>
        ),
      },
    ],
  },
];

export default clinicRoutes;
