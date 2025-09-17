// src/features/auth/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@context/AuthContext";

/**
 * ProtectedRoute
 * - If no user -> redirect to /auth (login/signup)
 * - If user exists but email_verified is false -> redirect to /verify-pending
 * - Otherwise render children
 *
 * Usage: wrap protected pages in <ProtectedRoute>...</ProtectedRoute>
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user } = useAuth() ?? {};
  const location = useLocation();

  if (!user) {
    // not authenticated
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If user exists but not verified, force them to verify first
  if (!user.email_verified) {
    // include the original destination so UX can continue after verification
    const redirectTo = `/verify-pending?next=${encodeURIComponent(
      location.pathname + (location.search || "")
    )}`;
    return <Navigate to={redirectTo} replace />;
  }

  // optional role guard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
