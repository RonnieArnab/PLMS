// src/components/layout/DashboardLayout.jsx
import React from "react";

/**
 * DashboardLayout (named export)
 * - Simplified layout with no navbar/header components.
 * - Removed KYC reminder logic per request; this file now only provides
 *   a consistent container for dashboard pages.
 *
 * Usage:
 *  import { DashboardLayout } from "@components/layout/DashboardLayout";
 *  <DashboardLayout> ...page content... </DashboardLayout>
 */
export function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <section>{children}</section>
      </main>
    </div>
  );
}

export default DashboardLayout;
