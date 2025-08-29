import React from "react";
import {
  Home,
  FileText,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const Sidebar = ({ isOpen, currentPage, onPageChange }) => {
  const { user } = useAuth();

  const applicantMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "apply", label: "Apply for Loan", icon: FileText },
    { id: "my-loans", label: "My Loans", icon: DollarSign },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "profile", label: "Profile", icon: Settings },
  ];

  const adminMenuItems = [
    { id: "admin-dashboard", label: "Dashboard", icon: Home },
    { id: "applications", label: "Applications", icon: FileText },
    { id: "loans", label: "Active Loans", icon: DollarSign },
    { id: "customers", label: "Customers", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const menuItems =
    user?.role === "admin" ? adminMenuItems : applicantMenuItems;

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 z-30 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-64 md:translate-x-0 md:static md:h-auto md:flex-shrink-0`}>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}>
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
