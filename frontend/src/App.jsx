import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./components/Auth/AuthPage";
import { Navbar } from "./components/Layout/Navbar";
import { Sidebar } from "./components/Layout/Sidebar";
import { UserDashboard } from "./components/Dashboard/UserDashboard";
import { AdminDashboard } from "./components/Dashboard/AdminDashboard";

import { MyLoans } from "./components/Pages/MyLoans";
import LandingPage from "./components/Pages/LandingPage";
import { LoanApplicationForm } from "./components/LoanApplication/LoanApplicationForm";

const AppContent = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    user?.role === "admin" ? "admin-dashboard" : "dashboard"
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <UserDashboard onNavigate={setCurrentPage} />;
      case "admin-dashboard":
        return <AdminDashboard />;
      case "apply":
        return <LoanApplicationForm />;
      case "my-loans":
        return <MyLoans />;
      case "payments":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Payments
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Payment management interface coming soon...
            </p>
          </div>
        );
      case "applications":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loan Applications
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Application management interface coming soon...
            </p>
          </div>
        );
      case "customers":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Customer management interface coming soon...
            </p>
          </div>
        );
      default:
        return user.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <UserDashboard onNavigate={setCurrentPage} />
        );
    }
  };

  // Logic to render the authenticated user's layout
  if (user) {
    if (showSuccess) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Application Submitted Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your loan application has been received and is being processed.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={true}
          onLogout={handleLogout}
        />

        <div className="flex">
          <Sidebar
            isOpen={sidebarOpen}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              setSidebarOpen(false);
            }}
          />

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex-1 p-6 md:ml-0">
            <div className="max-w-7xl mx-auto">{renderCurrentPage()}</div>
          </main>
        </div>
      </div>
    );
  }

  // Logic for unauthenticated users
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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
