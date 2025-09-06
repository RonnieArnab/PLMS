import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { DollarSign, Sun, Moon } from "lucide-react";

/**
 * Props:
 *  - user: current user object | null
 *  - isDark: boolean (true when dark mode is active)
 *  - toggleTheme: function to toggle theme (optional, no-op if not provided)
 */
export const LandingNavbar = ({
  user,
  isDark = false,
  toggleTheme = () => {},
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#E6F7F4]">
            <DollarSign className="w-5 h-5 text-[#00BFA6]" />
          </div>
          <span className="font-semibold tracking-tight text-[#0D1B2A] dark:text-white">
            ProLoan
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#6B7280] dark:text-gray-300">
          <a
            href="#features"
            className="hover:text-[#0D1B2A] dark:hover:text-white">
            Features
          </a>
          <a
            href="#analytics"
            className="hover:text-[#0D1B2A] dark:hover:text-white">
            Analytics
          </a>
          <a href="#how" className="hover:text-[#0D1B2A] dark:hover:text-white">
            How it works
          </a>
          <a href="#faq" className="hover:text-[#0D1B2A] dark:hover:text-white">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleTheme()}
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
            className="rounded-full p-2">
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {user ? (
            <Link to="/dashboard">
              <Button
                size="sm"
                variant="primary"
                className="rounded-xl bg-[#00BFA6] hover:bg-[#00A48E] text-white shadow-md hover:shadow-lg">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-[#00BFA6] text-[#00BFA6] hover:bg-[#E6F7F4]">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
