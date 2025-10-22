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
import { Actions } from "@/pages/CRM/Actions";
import { RepeatManagement } from "@/pages/CRM/RepeatManagement";
import { Dashboard as AdminDashboard } from "@/pages/Admin/Dashboard";
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

  console.log(
    "App: Rendering, isLoading:",
    isLoading,
    "isAuthenticated:",
    isAuthenticated,
    "user:",
    user,
    "refreshToken:",
    refreshToken ? `${refreshToken.substring(0, 20)}...` : "null"
  );

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
                  "salesperson",
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
                <ProtectedLayout allowedRoles={["clinic_owner", "salesperson"]}>
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
                <Customers />
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/customer/:id"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <CustomerDetails />
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/tasks"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <Tasks />
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/actions"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <Actions />
              </ProtectedLayout>
            }
          />
          <Route
            path="/crm/repeat-management"
            element={
              <ProtectedLayout allowedRoles={["salesperson"]}>
                <RepeatManagement />
              </ProtectedLayout>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/loyalty-management"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <LoyaltyManagement />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/monitor"
            element={
              <ProtectedLayout allowedRoles={["admin"]}>
                <Monitor />
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
