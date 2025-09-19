import React, { useEffect, useState } from "react";
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

const AuthHeader: React.FC = () => (
  <header className="bg-[#2D3748] border-b border-[#e5e7eb] sticky top-0 z-[100] shadow-sm">
    <div className="max-w-[480px] mx-auto px-4 py-6 flex items-center justify-center">
      <Link
        to="/"
        className="text-[2rem] font-medium text-white no-underline tracking-tight flex items-center"
      >
        <span className="text-[#CBFF38]">med</span>logo
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
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  useEffect(() => {
    const localRefreshToken = localStorage.getItem("refreshToken");
    if (!isAuthPage && !hasRestoredSession && localRefreshToken) {
      console.log(
        "App: Dispatching restoreSession, localStorage refreshToken:",
        localRefreshToken.substring(0, 20) + "..."
      );
      dispatch(restoreSession()).finally(() => setHasRestoredSession(true));
    }
  }, [dispatch, isAuthPage, hasRestoredSession]);

  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      location.pathname === "/login" &&
      hasRestoredSession
    ) {
      const from = location.state?.from?.pathname || "/my-account";
      console.log("App: Redirecting to original path:", from);
      navigate(from, { replace: true });
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

  if (isLoading && !isAuthPage) {
    return (
      <div className="flex justify-center items-center min-h-screen text-[var(--color-primary)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthPage ? <AuthHeader /> : <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<Booking />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={location.state?.from?.pathname || "/my-account"}
                  replace
                />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate
                  to={location.state?.from?.pathname || "/my-account"}
                  replace
                />
              ) : (
                <Register />
              )
            }
          />
          {/* Client Routes */}
          <Route
            path="/search"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <Search />
              </ProtectedLayout>
            }
          />
          <Route
            path="/clinic/:id"
            element={
              <ProtectedLayout allowedRoles={["client"]}>
                <ClinicDetails />
              </ProtectedLayout>
            }
          />
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
          {/* Clinic Routes */}
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
      {!isAuthPage && <Footer />}
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
