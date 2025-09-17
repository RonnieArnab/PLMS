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

import AuthPage from "@features/auth/pages/AuthPage";
import VerifySuccessPage from "@features/auth/pages/VerifySuccessPage.jsx";
import VerifyFailedPage from "@features/auth/pages/VerifyFailedPage.jsx";
import VerifyEmailPage from "@features/auth/pages/VerifyEmailPage.jsx";

import { Navbar } from "@components/layout/Navbar";
import ProtectedRoute from "@features/auth/components/ProtectedRoute";

import { UserDashboard } from "@features/dashboard/pages/UserDashboard";
import { MyLoans } from "@features/loans/pages/MyLoans";
import LoanApplicationForm from "@features/loans/pages/LoanApplicationForm";
import PaymentPage from "@features/payments/pages/PaymentsPage";
import ProfilePage from "@features/profile/pages/ProfilePage";
import LandingPage from "../pages/LandingPage";
import { LoanAppProvider } from "@features/loans";
import CustomerDetailsPage from "@features/auth/pages/CustomerDetailsPage.jsx"; // canonical details page
import KycReviewPage from "@features/profile/pages/KycReviewPage";
import KycUpdatePage from "@features/profile/pages/KycUpdatePage";

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();

  console.log(user);

  // Routes where we hide the navbar.
  const rootPathsToHide = ["/"];
  const prefixPathsToHide = [
    "/auth",
    "/verify-success",
    "/verify-failed",
    "/verify-pending",
  ];

  const hideNavbar =
    rootPathsToHide.includes(location.pathname) ||
    prefixPathsToHide.some((p) => location.pathname.startsWith(p));

  // Show navbar only to a signed-in AND email-verified user.
  const shouldShowNavbar = Boolean(user && user.email_verified) && !hideNavbar;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {shouldShowNavbar && <Navbar />}

      <Routes>
        {/* Public / landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth (login / signup)
            - If not logged in -> show AuthPage
            - If logged in & not verified -> redirect to verify-pending UI
            - If logged in & verified -> redirect to dashboard
        */}
        <Route
          path="/auth"
          element={
            !user ? (
              <AuthPage />
            ) : user && !user.email_verified ? (
              // redirect so the URL shows verify-pending and the dedicated page handles polling
              <Navigate to="/verify-pending" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Verification flow */}
        <Route
          path="/verify-pending"
          // Pass user's email if available so verify UI can display it
          element={<VerifyEmailPage email={user?.email} />}
        />
        <Route path="/verify-success" element={<VerifySuccessPage />} />
        <Route path="/verify-failed" element={<VerifyFailedPage />} />

        {/* Protected: profile details (KYC) */}
        <Route
          path="/profile/details"
          element={
            <ProtectedRoute>
              <CustomerDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Backwards compatibility */}
        <Route
          path="/profile/kyc"
          element={
            <ProtectedRoute>
              <KycUpdatePage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard & features (protected) */}
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

        {/* Generic profile page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
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
