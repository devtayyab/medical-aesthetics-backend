import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, AppDispatch } from "@/store";
import { restoreSession } from "@/store/slices/authSlice";
import { initializeFirebase } from "@/services/firebase";
import { Header } from "@/components/organisms/Header/Header";
import { HomePage } from "@/pages/HomePage/HomePage";
import { Login } from "@/pages/Login/Login";
import { Register } from "@/pages/Register/Register";
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
import type { RootState } from "@/store";
import "@/styles/globals.css";

const AuthHeader: React.FC = () => (
  <header className="bg-[#203400] border-b border-[#e5e7eb] sticky top-0 z-[100] shadow-sm">
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
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isAuthenticated, user, refreshToken } = useSelector(
    (state: RootState) => state.auth
  );
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    if (!isAuthPage) {
      console.log(
        "App: Dispatching restoreSession, localStorage refreshToken:",
        localStorage.getItem("refreshToken")
          ? `${localStorage.getItem("refreshToken")!.substring(0, 20)}...`
          : "null"
      );
      dispatch(restoreSession());
      initializeFirebase(dispatch);
    }
  }, [dispatch, isAuthPage]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-[var(--color-primary)]">
        Loading...
      </div>
    );
  }

  const role = user?.role || "";

  return (
    <div className="App">
      {isAuthPage ? <AuthHeader /> : <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register />
            }
          />
          {/* Client Routes */}
          <Route
            path="/search"
            element={
              isAuthenticated && role === "client" ? (
                <Search />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clinic/:id"
            element={
              isAuthenticated && role === "client" ? (
                <ClinicDetails />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/appointment/booking"
            element={
              isAuthenticated && role === "client" ? (
                <AppointmentBooking />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/appointments"
            element={
              isAuthenticated && role === "client" ? (
                <Appointments />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/history"
            element={
              isAuthenticated && role === "client" ? (
                <History />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/reviews"
            element={
              isAuthenticated && role === "client" ? (
                <Reviews />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/loyalty"
            element={
              isAuthenticated && role === "client" ? (
                <Loyalty />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Clinic Routes */}
          <Route
            path="/clinic/profile"
            element={
              isAuthenticated && role === "clinic_owner" ? (
                <ClinicProfile />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clinic/diary"
            element={
              isAuthenticated && role === "clinic_owner" ? (
                <Diary />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clinic/availability"
            element={
              isAuthenticated && role === "clinic_owner" ? (
                <Availability />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clinic/execution"
            element={
              isAuthenticated && role === "clinic_owner" ? (
                <Execution />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/clinic/reports"
            element={
              isAuthenticated && role === "clinic_owner" ? (
                <Reports />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* CRM Routes */}
          <Route
            path="/crm/customers"
            element={
              isAuthenticated && role === "salesperson" ? (
                <Customers />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/crm/customer/:id"
            element={
              isAuthenticated && role === "salesperson" ? (
                <CustomerDetails />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/crm/tasks"
            element={
              isAuthenticated && role === "salesperson" ? (
                <Tasks />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/crm/actions"
            element={
              isAuthenticated && role === "salesperson" ? (
                <Actions />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/crm/repeat-management"
            element={
              isAuthenticated && role === "salesperson" ? (
                <RepeatManagement />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              isAuthenticated && role === "admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/users"
            element={
              isAuthenticated && role === "admin" ? (
                <AdminUsers />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/loyalty-management"
            element={
              isAuthenticated && role === "admin" ? (
                <LoyaltyManagement />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/monitor"
            element={
              isAuthenticated && role === "admin" ? (
                <Monitor />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>
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
