import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a route that requires login, and optionally a specific role.
// Redirects to /login if not authenticated, or back to a safe page if
// the user is logged in but doesn't hold the required role.
export default function ProtectedRoute({ children, requireRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && !user.roles.includes(requireRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}