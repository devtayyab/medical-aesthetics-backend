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
import { Header } from "@/components/organisms/Header/Header";
import { HomePage } from "@/pages/HomePage/HomePage";
import { Login } from "@/pages/Login/Login";
import { Register } from "@/pages/Register/Register";
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
