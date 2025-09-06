import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";

import { AuthPage } from "@features/auth/pages/AuthPage";
import { Navbar } from "@components/layout/Navbar";

import { UserDashboard } from "@features/dashboard/pages/UserDashboard";
import { MyLoans } from "@features/loans/pages/MyLoans";
import { LoanApplicationForm } from "@features/loans/pages/LoanApplicationForm";
import PaymentPage from "@features/payments/pages/PaymentsPage";
import ProfilePage from "@features/profile/pages/ProfilePage";
import LandingPage from "../pages/LandingPage";
import { LoanAppProvider } from "@features/loans";

// 🔒 Protect routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  // hide navbar on landing and auth pages
  const hideNavbarRoutes = ["/", "/auth"];
  const shouldShowNavbar =
    user && !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {shouldShowNavbar && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <LoanAppProvider>
              <ProtectedRoute>
                <LoanApplicationForm />
              </ProtectedRoute>
            </LoanAppProvider>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <MyLoans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
