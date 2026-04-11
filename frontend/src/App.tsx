import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Link,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, AppDispatch } from "@/store";
import { restoreSession } from "@/store/slices/authSlice";
import { Header } from "@/components/organisms/Header/Header";
import { Footer } from "@/components/organisms/Footer/Footer";
import { HomePage } from "@/pages/HomePage/HomePage";
import { Booking } from "@/pages/Booking/Booking";
import { Clinic } from "@/pages/ClinicPage/ClinicPage";
import { Login } from "@/pages/Login/Login";
import { Register } from "@/pages/Register/Register";
import { ProtectedLayout } from "@/components/organisms/ProtectedLayout";
import { Search } from "@/pages/Client/Search";
import { TreatmentDetails } from "@/pages/Client/TreatmentDetails";
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'));
import { AppointmentBooking } from "@/pages/Client/AppointmentBooking";
import { Appointments } from "@/pages/Client/Appointments";
import { History } from "@/pages/Client/History";
import { Reviews } from "@/pages/Client/Reviews";
import { Loyalty } from "@/pages/Client/Loyalty";
import { Profile as ClinicProfile } from "@/pages/Clinic/Profile";
import { Diary } from "@/pages/Clinic/Diary";
import { SalesDiaryPage } from "./pages/CRM/SalesDiaryPage";
import { Availability } from "@/pages/Clinic/Availability";
import { Execution } from "@/pages/Clinic/Execution";
import { Reports } from "@/pages/Clinic/Reports";
import ClinicLayout from "@/pages/Clinic/ClinicLayout";
import ClinicDashboard from "@/pages/Clinic/ClinicDashboard";
import AppointmentsPage from "@/pages/Clinic/AppointmentsPage";
import ServicesPage from "@/pages/Clinic/ServicesPage";
import AvailabilityPage from "@/pages/Clinic/AvailabilityPage";
import AnalyticsPage from "@/pages/Clinic/AnalyticsPage";
import ClientsPage from "@/pages/Clinic/ClientsPage";
import ReviewsPage from "@/pages/Clinic/ReviewsPage";
import NotificationsPage from "@/pages/Clinic/NotificationsPage";
import SettingsPage from "@/pages/Clinic/SettingsPage";
import StaffPage from "@/pages/Clinic/StaffPage";
import { Customers } from "@/pages/CRM/Customers";
import { ArchivedLeads } from "@/pages/CRM/ArchivedLeads";
import { CustomerDetails } from "@/pages/CRM/CustomerDetails";
import { Tasks } from "@/pages/CRM/Tasks";
import { Actions } from "@/pages/CRM/Action";
import { RepeatManagement } from "@/pages/CRM/RepeatManagement";
import { Dashboard as AdminDashboard } from "@/pages/Admin/Dashboard";
import { ManagerDashboard } from "./pages/Admin/ManagerDashboard/ManagerDashboard";
import { Users as AdminUsers } from "@/pages/Admin/Users";
import { Clinics as AdminClinics } from "@/pages/Admin/Clinics";
import { LoyaltyManagement } from "@/pages/Admin/LoyaltyManagement";
import { ReviewModeration } from "@/pages/Admin/ReviewModeration";
import { TherapyCatalog as AdminTherapyCatalog } from "@/pages/Admin/TherapyCatalog";
import { Monitor } from "@/pages/Admin/Monitor";
import { Wallet as AdminWallet } from "@/pages/Admin/Wallet";
import { Payments as AdminPayments } from "@/pages/Admin/Payments";
import { GiftCards as AdminGiftCards } from "@/pages/Admin/GiftCards";
import { BlogManagement as AdminBlogManagement } from "@/pages/Admin/BlogManagement";
import { Integrations as AdminIntegrations } from "@/pages/Admin/Integrations";
import { NotificationSettings as AdminNotificationSettings } from "@/pages/Admin/NotificationSettings";
import { AuditLogs as AdminAuditLogs } from "@/pages/Admin/AuditLogs";
import { SystemLists } from './pages/Admin/SystemLists';

import { MyAccount } from "@/pages/Client/MyAccount";
import { PersonalDetails } from "@/pages/Client/AccountPages/PersonalDetails";
import { Rewards } from "@/pages/Client/AccountPages/Rewards";
import { Payments } from "@/pages/Client/AccountPages/Payments";
import { GiftCard } from "@/pages/Client/AccountPages/GiftCard";
import { Blog } from "@/pages/Client/Blog";
import { BlogPost } from "@/pages/Client/BlogPost";
import { Treatments } from "@/pages/Client/Treatments";
import { Services } from "@/pages/Client/Services";
import { Legal, SupportCenter, ChatSupport } from "@/pages/Client/InfoPages/InfoPages";
import { InviteFriend } from "@/pages/Client/AccountPages/InviteFriend";
import { Settings } from "@/pages/Client/AccountPages/Settings";
import type { RootState } from "@/store";
import "@/styles/globals.css";

import SiteLogo from "@/assets/SiteLogo.png";
import { CRM } from "./pages/CRM/CRM";
import { CheckoutPage } from "./pages/Client/CheckoutPage";
import BookingConfirmation from "./pages/Client/BookingConfirmation";
import { PaymentResultPage } from "./pages/Client/PaymentResultPage";
import AdminLayout from "@/components/layouts/AdminLayout";
import ClientLayout from "@/components/layouts/ClientLayout";
import { Calls as ManagerCrmCalls } from "@/pages/Admin/ManagerCRM/Calls";
import { Reports as ManagerCrmReports } from "@/pages/Admin/ManagerCRM/Reports";
import { Advertising as ManagerCrmAdvertising } from "@/pages/Admin/ManagerCRM/Advertising";
import { AccessControl as ManagerCrmAccessControl } from "@/pages/Admin/ManagerCRM/AccessControl";
import { Benefits as ManagerCrmBenefits } from "@/pages/Admin/ManagerCRM/Benefits";
import { NoShowAlerts as ManagerCrmNoShowAlerts } from "@/pages/Admin/ManagerCRM/NoShowAlerts";
import { ClinicStats as ManagerCrmClinicStats } from "@/pages/Admin/ManagerCRM/ClinicStats";
import { LeadsPage } from "./pages/CRM/Leads";
import { Communication } from "./pages/CRM/Communication";
import { Analytics } from "./pages/CRM/Analytics";
import { Tags } from "./pages/CRM/Tags";
import { FacebookIntegration } from "./pages/CRM/FacebookIntegration";
import { Settings as CrmSettings } from "./pages/CRM/Settings";
import { Notifications as NotificationsCrm } from "./pages/CRM/Notifications";
import { SalesAnalyticsDashboard } from "./pages/CRM/SalesAnalyticsDashboard";
import ClinicAnalyticsPage from "./pages/Admin/ClinicAnalyticsPage";
import { ChangePassword } from "@/pages/Account/ChangePassword";
import { Toaster } from "react-hot-toast";
import { MessagesPage } from "@/pages/Messages/MessagesPage";
import { SalesWeekCalendar } from "./pages/CRM/SalesWeekCalendar";
import { initializeFirebase } from "@/services/firebase";
import { GlobalDialer } from "./components/crm/GlobalDialer";

const AuthHeader: React.FC = () => (
  <header className="bg-[#2D3748] border-b border-[#e5e7eb] sticky top-0 z-[100] shadow-sm">
    <div className="max-w-[480px] mx-auto p-4 flex items-center justify-center">
      <Link
        to="/"
        className="text-[2rem] font-medium text-white no-underline tracking-tight flex items-center"
      >
        <img src={SiteLogo} alt="Site Logo" className="w-[200px]" />
      </Link>
    </div>
  </header>
);

/** Returns the correct home path for a given role */
function getRoleHomePath(role?: string): string {
  if (!role) return "/";
  if (role === "SUPER_ADMIN" || role === "manager") return "/admin/manager-dashboard";
  if (role === "admin") return "/admin/dashboard";
  if (role === "salesperson") return "/crm";
  if (role === "doctor" || role === "secretariat") return "/clinic/appointments";
  if (role === "clinic_owner") return "/clinic/dashboard";
  if (role === "client") return "/";
  return "/";
}

const ClinicIndexRedirect: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  if (user?.role === "doctor" || user?.role === "secretariat") {
    return <Navigate to="/clinic/appointments" replace />;
  }
  return <Navigate to="/clinic/dashboard" replace />;
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  const restoreStartedRef = useRef(false);

  useEffect(() => {
    // Attempt to restore session once on initial load. React StrictMode in
    // development mounts components twice; guard with a ref so we don't
    // dispatch duplicate restoreSession actions which would trigger two
    // refresh requests.
    if (!restoreStartedRef.current) {
      restoreStartedRef.current = true;
      dispatch(restoreSession()).finally(() => setHasRestoredSession(true));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeFirebase(dispatch);
    }
  }, [isAuthenticated, dispatch]);

  // Role-aware redirect after session restore or login
  useEffect(() => {
    if (
      hasRestoredSession &&
      isAuthenticated &&
      !isLoading &&
      (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/")
    ) {
      if (user?.role === "SUPER_ADMIN" || user?.role === "manager") {
        navigate("/admin/manager-dashboard", { replace: true });
      } else if (user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user?.role === "salesperson") {
        navigate("/crm", { replace: true });
      } else if (user?.role === "doctor" || user?.role === "secretariat") {
        navigate("/clinic/appointments", { replace: true });
      } else if (user?.role === "clinic_owner") {
        navigate("/clinic/dashboard", { replace: true });
      } else if (user?.role === "client") {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate, hasRestoredSession, user?.role]);

  // Show loader until session is restored
  if (!hasRestoredSession || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="size-12 border-4 border-t-4 border-[#2D3748] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {location.pathname === "/login" || location.pathname === "/register" ? (
        <AuthHeader />
      ) : (
        <Header />
      )}
      <main>
        <Routes>
          <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
          <Route path="/booking" element={<ClientLayout><Booking /></ClientLayout>} />
          <Route path="/clinicpage" element={<ClientLayout><Clinic /></ClientLayout>} />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate to={getRoleHomePath(user?.role)} replace />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              !isAuthenticated ? (
                <Suspense fallback={<div>Loading...</div>}>
                  <ForgotPassword />
                </Suspense>
              ) : (
                <Navigate to={getRoleHomePath(user?.role)} replace />
              )
            }
          />
          <Route
            path="/reset-password"
            element={
              !isAuthenticated ? (
                <Suspense fallback={<div>Loading...</div>}>
                  <ResetPassword />
                </Suspense>
              ) : (
                <Navigate to={getRoleHomePath(user?.role)} replace />
              )
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register />
              ) : (
                <Navigate to={getRoleHomePath(user?.role)} replace />
              )
            }
          />


          {/* Client Routes - Public clinic browsing */}
          <Route path="/search" element={<ClientLayout><Search /></ClientLayout>} />
          <Route path="/clinic/:id" element={<ClientLayout><ClinicDetails /></ClientLayout>} />
          <Route path="/treatment/:id" element={<ClientLayout><TreatmentDetails /></ClientLayout>} />
          <Route path="/blog" element={<ClientLayout><Blog /></ClientLayout>} />
          <Route path="/articles" element={<ClientLayout><Blog /></ClientLayout>} />
          <Route path="/blog/:slug" element={<ClientLayout><BlogPost /></ClientLayout>} />
          <Route path="/treatments" element={<ClientLayout><Treatments /></ClientLayout>} />
          <Route path="/services" element={<ClientLayout><Services /></ClientLayout>} />

          {/* Protected booking route - requires login */}
          <Route
            path="/appointment/booking"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <AppointmentBooking />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <Appointments />
                </ClientLayout>
              </ProtectedLayout>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <History />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <Reviews />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <Loyalty />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/my-account"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <MyAccount />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <NotificationsCrm />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/personal-details"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <PersonalDetails />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <Rewards />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <Payments />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/gift-card"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <GiftCard />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/legal"
            element={<ClientLayout><Legal /></ClientLayout>}
          />
          <Route
            path="/support"
            element={<ClientLayout><SupportCenter /></ClientLayout>}
          />
          <Route
            path="/chat"
            element={<ClientLayout><ChatSupport /></ClientLayout>}
          />
          <Route
            path="/checkout"
            element={
              <ProtectedLayout allowedRoles={["client", "salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <CheckoutPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/booking-confirmation"
            element={
              <ProtectedLayout allowedRoles={["client", "salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <BookingConfirmation />
              </ProtectedLayout>
            }
          />
          {/* Viva Wallet Payment Result Pages - must be PUBLIC so Viva can redirect here */}
          <Route path="/payment/success" element={<PaymentResultPage />} />
          <Route path="/payment/failure" element={<PaymentResultPage />} />
          <Route
            path="/invite-friend"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <InviteFriend />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClientLayout>
                  <Settings />
                </ClientLayout>
              </ProtectedLayout>
            }
          />
          {/* Clinic Routes - New Comprehensive Implementation */}
          <Route
            path="/clinic"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "clinic_owner",
                  "doctor",
                  "secretariat",
                ]}
              >
                <ClinicLayout />
              </ProtectedLayout>
            }
          >
            <Route
              index
              element={<ClinicIndexRedirect />}
            />
            <Route path="dashboard" element={<ClinicDashboard />} />
            <Route path="profile" element={<ClinicProfile />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route
              path="services"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "secretariat"]}>
                  <ServicesPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="availability-settings"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "secretariat"]}>
                  <AvailabilityPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner"]}>
                  <AnalyticsPage />
                </ProtectedLayout>
              }
            />
            <Route path="clients" element={<ClientsPage />} />
            <Route
              path="reviews"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "secretariat"]}>
                  <ReviewsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "secretariat"]}>
                  <NotificationsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="my-notifications"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "doctor", "secretariat"]}>
                  <NotificationsCrm />
                </ProtectedLayout>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner"]}>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="diary"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "doctor", "secretariat"]}>
                  <Diary />
                </ProtectedLayout>
              }
            />
            <Route
              path="messages"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "doctor", "secretariat"]}>
                  <MessagesPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="sales-diary"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "manager", "admin", "salesperson"]}>
                  <SalesDiaryPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="availability"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner"]}>
                  <Availability />
                </ProtectedLayout>
              }
            />
            <Route
              path="execution"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner"]}>
                  <Execution />
                </ProtectedLayout>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner"]}>
                  <Reports />
                </ProtectedLayout>
              }
            />
            <Route
              path="staff"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner", "admin"]}>
                  <StaffPage />
                </ProtectedLayout>
              }
            />
          </Route>

          {/* CRM Routes */}
          <Route
            path="/crm/customers"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <Customers />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/archive"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <ArchivedLeads />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/customer/:id"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <CustomerDetails />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/tasks"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <Tasks />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/leads"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <LeadsPage />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/actions"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <Actions />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/calendar"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <SalesWeekCalendar />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/repeat-management"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <RepeatManagement />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <CRM />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/notifications"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <NotificationsCrm />
                </AdminLayout>
              </ProtectedLayout>
            }
          />

          <Route
            path="/crm/communication"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <Communication />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/analytics"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <Analytics />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/sales-analytics"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <SalesAnalyticsDashboard />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/clinic-analytics"
            element={
              <ProtectedLayout allowedRoles={["manager", "admin", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <ClinicAnalyticsPage />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/tag"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <Tags />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/facebook-integration"
            element={
              <ProtectedLayout allowedRoles={["manager", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <FacebookIntegration />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/settings"
            element={
              <ProtectedLayout allowedRoles={["salesperson", "manager", "admin", "clinic_owner", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <CrmSettings />
                </AdminLayout>
              </ProtectedLayout>
            }
          />


          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN"]}>
                <AdminLayout>
                  <ReviewModeration />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/treatments"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminTherapyCatalog />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-dashboard"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerDashboard />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/calls"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmCalls />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/reports"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmReports />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/advertising"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmAdvertising />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/access"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmAccessControl />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/benefits"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmBenefits />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/no-show-alerts"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmNoShowAlerts />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/clinic-stats"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "clinic_owner", "manager"]}>
                <AdminLayout>
                  <ManagerCrmClinicStats />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/broadcast"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN", "admin", "manager"]}>
                <AdminLayout>
                  <NotificationsPage />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/clinics"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminClinics />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/loyalty-management"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <AdminLayout>
                  <LoyaltyManagement />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/monitor"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <AdminLayout>
                  <Monitor />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/wallet"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminWallet />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminPayments />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/gift-cards"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminGiftCards />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <ReviewModeration />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminBlogManagement />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/notification-settings"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminNotificationSettings />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/integrations"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminIntegrations />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedLayout allowedRoles={["client", "salesperson", "manager", "admin", "clinic_owner", "doctor", "secretariat", "SUPER_ADMIN"]}>
                {user?.role === "client" ? (
                  <ClientLayout>
                    <MessagesPage />
                  </ClientLayout>
                ) : (
                  <AdminLayout>
                    <MessagesPage />
                  </AdminLayout>
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedLayout allowedRoles={["client", "salesperson", "manager", "admin", "clinic_owner", "doctor", "secretariat", "SUPER_ADMIN"]}>
                {user?.role === "client" ? (
                  <ClientLayout>
                    <ChangePassword />
                  </ClientLayout>
                ) : (
                  <AdminLayout>
                    <ChangePassword />
                  </AdminLayout>
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <AdminAuditLogs />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/system-lists"
            element={
              <ProtectedLayout allowedRoles={["admin", "SUPER_ADMIN", "manager"]}>
                <AdminLayout>
                  <SystemLists />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
        </Routes>
      </main>
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Footer />
      )}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Toaster position="top-right" reverseOrder={false} />
      <GlobalDialer />
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
