import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { restoreSession } from "@/store/slices/authSlice";
import type { RootState, AppDispatch } from "@/store";
import { Sidebar } from "@/components/organisms/Sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  children,
  allowedRoles = [],
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, refreshToken, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  useEffect(() => {
    const localRefreshToken = localStorage.getItem("refreshToken");
    if (!isAuthenticated && localRefreshToken) {
      console.log("ProtectedLayout: Dispatching restoreSession on reload");
      dispatch(restoreSession());
    }
  }, [dispatch, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-[var(--color-primary)]">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("ProtectedLayout: Not authenticated, redirecting to /login", {
      location: location.pathname,
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || "")) {
    console.log("ProtectedLayout: Role not allowed, redirecting to /", {
      userRole: user?.role,
      allowedRoles,
    });
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex max-w-[1200px] mx-auto p-4">
      <Sidebar />
      <div className="flex-1 ml-64">{children}</div>
    </div>
  );
};
