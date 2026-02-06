import React, { useEffect, useState, useRef } from "react";
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
import { ClinicDetails } from "@/pages/Client/ClinicDetails";
import { AppointmentBooking } from "@/pages/Client/AppointmentBooking";
import { Appointments } from "@/pages/Client/Appointments";
import { History } from "@/pages/Client/History";
import { Reviews } from "@/pages/Client/Reviews";
import { Loyalty } from "@/pages/Client/Loyalty";
import { Profile as ClinicProfile } from "@/pages/Clinic/Profile";
import { Diary } from "@/pages/Clinic/Diary";
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
import { Customers } from "@/pages/CRM/Customers";
import { CustomerDetails } from "@/pages/CRM/CustomerDetails";
import { Tasks } from "@/pages/CRM/Tasks";
import { Actions } from "@/pages/CRM/Action";
import { RepeatManagement } from "@/pages/CRM/RepeatManagement";
import { Dashboard as AdminDashboard } from "@/pages/Admin/Dashboard";
import { ManagerDashboard } from "./pages/Admin/ManagerDashboard/ManagerDashboard";
import { Users as AdminUsers } from "@/pages/Admin/Users";
import { LoyaltyManagement } from "@/pages/Admin/LoyaltyManagement";
import { Monitor } from "@/pages/Admin/Monitor";
import { MyAccount } from "@/pages/Client/MyAccount";
import { PersonalDetails } from "@/pages/Client/AccountPages/PersonalDetails";
import { Rewards } from "@/pages/Client/AccountPages/Rewards";
import { Wallet } from "@/pages/Client/AccountPages/Wallet";
import { InviteFriend } from "@/pages/Client/AccountPages/InviteFriend";
import { Settings } from "@/pages/Client/AccountPages/Settings";
import type { RootState } from "@/store";
import "@/styles/globals.css";

import SiteLogo from "@/assets/SiteLogo.png";
import { CRM } from "./pages/CRM/CRM";
import { CheckoutPage } from "./pages/Client/CheckoutPage";
import BookingConfirmation from "./pages/Client/BookingConfirmation";
import AdminLayout from "@/components/layouts/AdminLayout";
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

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isAuthenticated, user, refreshToken } = useSelector(
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

  // Only redirect to /my-account from /login or /register after session is restored
  useEffect(() => {
    if (
      hasRestoredSession &&
      isAuthenticated &&
      !isLoading &&
      (location.pathname === "/login" || location.pathname === "/register")
    ) {
      navigate("/my-account", { replace: true });
    }
  }, [isAuthenticated, isLoading, location, navigate, hasRestoredSession]);


  useEffect(() => {
    if (
      user?.role === "SUPER_ADMIN"
    ) {
      navigate("/admin/manager-dashboard", { replace: true });
    }
  }, [user]);

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
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/clinicpage" element={<Clinic />} />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate to="/my-account" replace />
              )
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register />
              ) : (
                <Navigate to="/my-account" replace />
              )
            }
          />


          {/* Client Routes - Public clinic browsing */}
          <Route path="/search" element={<Search />} />
          <Route path="/clinic/:id" element={<ClinicDetails />} />

          {/* Protected booking route - requires login */}
          <Route
            path="/appointment/booking"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <AppointmentBooking />
              </ProtectedLayout>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Appointments />
              </ProtectedLayout>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <History />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Reviews />
              </ProtectedLayout>
            }
          />
          <Route
            path="/loyalty"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Loyalty />
              </ProtectedLayout>
            }
          />
          <Route
            path="/my-account"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <MyAccount />
              </ProtectedLayout>
            }
          />
          <Route
            path="/personal-details"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <PersonalDetails />
              </ProtectedLayout>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Rewards />
              </ProtectedLayout>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Wallet />
              </ProtectedLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <CheckoutPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/booking-confirmation"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <BookingConfirmation />
              </ProtectedLayout>
            }
          />
          <Route
            path="/invite-friend"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <InviteFriend />
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Settings />
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
              element={<Navigate to="/clinic/dashboard" replace />}
            />
            <Route path="dashboard" element={<ClinicDashboard />} />
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
              path="settings"
              element={
                <ProtectedLayout allowedRoles={["clinic_owner"]}>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />
          </Route>

          {/* Old Clinic Routes - Keep for backward compatibility */}
          <Route
            path="/clinic/profile"
            element={
              <ProtectedLayout allowedRoles={["clinic_owner"]}>
                <ClinicProfile />
              </ProtectedLayout>
            }
          />
          <Route
            path="/clinic/diary"
            element={
              <ProtectedLayout allowedRoles={["clinic_owner"]}>
                <Diary />
              </ProtectedLayout>
            }
          />
          <Route
            path="/clinic/availability"
            element={
              <ProtectedLayout allowedRoles={["clinic_owner"]}>
                <Availability />
              </ProtectedLayout>
            }
          />
          <Route
            path="/clinic/execution"
            element={
              <ProtectedLayout allowedRoles={["clinic_owner"]}>
                <Execution />
              </ProtectedLayout>
            }
          />
          <Route
            path="/clinic/reports"
            element={
              <ProtectedLayout allowedRoles={["clinic_owner"]}>
                <Reports />
              </ProtectedLayout>
            }
          />
          {/* CRM Routes */}
          <Route
            path="/crm/customers"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <Customers />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/customer/:id"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <CustomerDetails />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/tasks"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <Tasks />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/leads"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <LeadsPage />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/actions"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  < Actions />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/repeat-management"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <RepeatManagement />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <CRM />
                </AdminLayout>
              </ProtectedLayout>
            }
          />

          <Route
            path="/crm/communication"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <Communication />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/analytics"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <Analytics />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/tag"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <Tags />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/facebook-integration"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <AdminLayout>
                  <FacebookIntegration />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/settings"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
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
            path="/admin/manager-dashboard"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerDashboard />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/calls"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmCalls />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/reports"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmReports />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/advertising"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmAdvertising />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/access"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmAccessControl />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/benefits"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmBenefits />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/no-show-alerts"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmNoShowAlerts />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/manager-crm/clinic-stats"
            element={
              <ProtectedLayout allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout>
                  <ManagerCrmClinicStats />
                </AdminLayout>
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <AdminLayout>
                  <AdminUsers />
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
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
