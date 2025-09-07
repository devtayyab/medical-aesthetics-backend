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
import { css } from "@emotion/css";
import type { RootState } from "@/store";
import "@/styles/globals.css";

const authHeaderStyle = css`
  background-color: #203400;
  border-bottom: 1px solid var(--color-medical-border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04));
`;

const authContainerStyle = css`
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const authLogoStyle = css`
  font-size: 2rem;
  font-weight: 500;
  color: var(--color-white);
  text-decoration: none;
  letter-spacing: -0.025em;
  display: flex;
  align-items: center;
`;

const loadingStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: var(--color-primary);
`;

const AuthHeader: React.FC = () => (
  <header className={authHeaderStyle}>
    <div className={authContainerStyle}>
      <Link to="/" className={authLogoStyle}>
        <span style={{ color: "#CBFF38" }}>med</span>logo
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
    console.log(
      "App: Dispatching restoreSession, localStorage refreshToken:",
      localStorage.getItem("refreshToken")
        ? `${localStorage.getItem("refreshToken")!.substring(0, 20)}...`
        : "null"
    );
    dispatch(restoreSession());
  }, [dispatch]);

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
    return <div className={loadingStyle}>Loading...</div>;
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
