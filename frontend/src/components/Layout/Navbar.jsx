import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@context/ThemeContext";
import { useAuth } from "@context/AuthContext";
import { Button } from "../ui/Button";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isDark, toggleTheme, storedChoice } = useTheme();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close mobile menu on route change (optional)
  useEffect(() => {
    return () => {
      setMenuOpen(false);
      setUserMenuOpen(false);
    };
  }, [navigate]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard" },
    { id: "apply", label: "Apply for Loan", path: "/apply" },
    { id: "loans", label: "My Loans", path: "/loans" },
    { id: "payments", label: "Payments", path: "/payments" },
    { id: "profile", label: "Profile", path: "/profile" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-green-100">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-semibold tracking-tight text-gray-900 dark:text-white">
            ProLoan
          </span>
        </Link>

        {/* Desktop Menu with animated underline */}
        <nav className="hidden md:flex items-center gap-6 text-sm relative">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `relative transition font-medium pb-1 ${
                  isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                }`
              }>
              {({ isActive }) => (
                <div className="relative flex flex-col items-center">
                  <span>{item.label}</span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="underline"
                        className="absolute -bottom-1 h-[2px] w-full bg-green-600 dark:bg-green-400 rounded"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0 }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle
              UX note: show the icon of the theme the button will *switch to* (clear affordance) */}
          <Button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light" : "Switch to dark"}>
            {isDark ? <Sun /> : <Moon />}
          </Button>

          {/* User Dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-3 focus:outline-none">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : user.email
                    ? user.email
                        .split("@")[0]
                        .split(/[.\-_]/)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>

                <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-white">
                  {user.name || user.email || "User"}
                </span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <User className="w-4 h-4" /> Profile
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Hamburger */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="Toggle menu">
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden px-4 pb-4 space-y-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
            {menuItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`
                }>
                {item.label}
              </NavLink>
            ))}

            {user && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                Logout
              </button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
