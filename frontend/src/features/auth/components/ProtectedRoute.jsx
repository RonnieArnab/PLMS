// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@context/AuthContext";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  // while we're restoring session, show nothing (or a spinner)
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!user) return <Navigate to="/auth" replace />;

  if (requiredRole && user.role !== requiredRole) {
    // optionally redirect or show forbidden
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
