import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

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

  return <div>{children}</div>;
};
