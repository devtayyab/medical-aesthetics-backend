import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/store";
import { fetchUser } from "@/store/slices/authSlice";
import { Header } from "@/components/organisms/Header/Header";
import { HomePage } from "@/pages/HomePage/HomePage";
import { Login } from "@/pages/Login/Login";
import { Register } from "@/pages/Register/Register";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import "@/styles/globals.css";

// AuthHeader styles
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
  const { isAuthenticated, isLoading, user, initializing } = useSelector(
    (state: RootState) => state.auth
  );
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && !user && !isLoading) {
      dispatch(fetchUser());
    }
  }, [dispatch, user, isLoading]);

  return (
    <div className="App">
      {isAuthPage ? <AuthHeader /> : <Header />}
      <main>
        {initializing ? (
          <div>Loading...</div>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        )}
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
