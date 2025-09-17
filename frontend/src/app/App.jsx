// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "@context/AuthContext";

import { AuthPage } from "@features/auth/pages/AuthPage";
import { Navbar } from "@components/layout/Navbar";
import ProtectedRoute from "@features/auth/components/ProtectedRoute";

import { UserDashboard } from "@features/dashboard/pages/UserDashboard";
import { MyLoans } from "@features/loans/pages/MyLoans";
import { LoanApplicationForm } from "@features/loans/pages/LoanApplicationForm";
import PaymentPage from "@features/payments/pages/PaymentsPage";
import ProfilePage from "@features/profile/pages/ProfilePage";
import LandingPage from "../pages/LandingPage";
import { LoanAppProvider } from "@features/loans";
import KycUpdatePage from "@features/profile/pages/KycUpdatePage";
import KycGate from "@features/loans/pages/KycGate";

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  const hideNavbarRoutes = ["/", "/auth"];
  const shouldShowNavbar =
    user && !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {shouldShowNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />

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
            <ProtectedRoute>
              <KycGate>
                <LoanAppProvider>
                  <LoanApplicationForm />
                </LoanAppProvider>
              </KycGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <KycGate>
                <MyLoans />
              </KycGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <KycGate>
              <PaymentPage />
              </KycGate>
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
        <Route
          path="/profile/kyc"
          element={
            <ProtectedRoute>
              <KycUpdatePage />
            </ProtectedRoute>
          }
        />
        {/* Example admin-only route */}
        {/* <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard/></ProtectedRoute>} /> */}

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
