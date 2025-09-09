// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import HeaderHero from "@features/dashboard/components/HeaderHero.jsx";
import StatCard from "@features/dashboard/components/StatCard.jsx";
import ChartCards from "@features/dashboard/components/ChartCards.jsx";
import ApplicationsTable from "@features/dashboard/components/ApplicationsTable.jsx";
import { Grid } from "@components/ui/Grid.jsx";
import { Button } from "@components/ui/Button.jsx";

import { useTheme } from "@context/ThemeContext";
import {
  fetchDashboardStats,
  fetchLoanApplications,
  fetchPaymentHistory,
  fetchPortfolioBreakdown,
} from "@services/dashboardService";
import { Layers, TrendingUp, Clock, CheckCircle, Download } from "lucide-react";
import { Card } from "@components/ui/Card.jsx";

// ✅ API handler wrapper
async function apiHandler(fn, fallback) {
  try {
    const res = await fn?.();
    return res || fallback;
  } catch (err) {
    console.error("API error:", err);
    return fallback;
  }
}

// ✅ Skeleton loaders
function StatSkeleton() {
  return (
    <Card className="p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-base-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-base-200 rounded animate-pulse mb-2" />
          <div className="h-6 w-32 bg-base-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

function ChartSkeleton({ height = 320 }) {
  return (
    <Card className="p-5 rounded-lg shadow-sm min-h-[360px] flex flex-col">
      <div className="mb-4 h-6 w-1/3 bg-base-200 rounded animate-pulse" />
      <div
        className="flex-1 bg-base-200/50 rounded animate-pulse"
        style={{ height }}
      />
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="p-4 rounded-lg shadow-sm">
      <div className="space-y-3">
        <div className="h-5 w-1/4 bg-base-200 rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-full bg-base-200 rounded animate-pulse"
          />
        ))}
      </div>
    </Card>
  );
}

// ✅ Currency formatter
const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);

export function UserDashboard() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState(null);
  const [payments, setPayments] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isDark } = useTheme();

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      const [s, a, p, b] = await Promise.all([
        apiHandler(fetchDashboardStats, [
          { title: "Active Loans", value: 2, diff: 12 },
          { title: "Pending Applications", value: 1, diff: -5 },
          { title: "Total Borrowed", value: 125000, diff: 8 },
          { title: "Credit Score", value: 785, diff: 15 },
        ]),
        apiHandler(fetchLoanApplications, [
          {
            id: 1,
            amount: 50000,
            purpose: "Practice Equipment",
            status: "approved",
            submittedAt: new Date("2024-01-15").getTime(),
          },
          {
            id: 2,
            amount: 75000,
            purpose: "Office Setup",
            status: "under-review",
            submittedAt: new Date("2024-01-20").getTime(),
          },
        ]),
        apiHandler(fetchPaymentHistory, [
          { month: "Jan", amount: 20000 },
          { month: "Feb", amount: 25000 },
          { month: "Mar", amount: 23000 },
          { month: "Apr", amount: 28000 },
          { month: "May", amount: 32000 },
          { month: "Jun", amount: 25000 },
        ]),
        apiHandler(fetchPortfolioBreakdown, [
          { name: "Equipment Loan", value: 50000 },
          { name: "Office Setup", value: 75000 },
        ]),
      ]);

      if (!mounted) return;

      setStats(s);
      setApplications(a);
      setPayments(p);
      setPortfolio(b);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const lineData = useMemo(
    () => [
      {
        id: "Payments",
        data: (payments || []).map((p) => ({ x: p.month, y: p.amount })),
      },
    ],
    [payments]
  );

  const pieData = useMemo(
    () => (portfolio || []).map((p) => ({ id: p.name, value: p.value })),
    [portfolio]
  );

  // ✅ Icons for KPI cards
  const iconMap = {
    "Active Loans": Layers,
    "Total Borrowed": TrendingUp,
    "Pending Applications": Clock,
    "Credit Score": CheckCircle,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Hero Section */}
        <HeaderHero onApply={() => console.log("apply clicked")} />

        {/* KPI Stats Row */}
        <Grid cols={4} className="gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : (stats || []).map((s) => {
                const Icon = iconMap[s.title];
                return (
                  <StatCard
                    key={s.title}
                    title={s.title}
                    value={
                      s.title === "Total Borrowed"
                        ? `₹${inr(s.value)}`
                        : inr(s.value)
                    }
                    diff={s.diff}
                    icon={Icon && <Icon className="w-5 h-5" />}
                    color={s.title === "Total Borrowed" ? "emerald" : "lime"}
                    currency={s.title === "Total Borrowed"}
                  />
                );
              })}
        </Grid>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <ChartCards
              lineData={lineData}
              pieData={pieData}
              portfolio={portfolio}
              isDark={isDark}
            />
          )}
        </div>

        {/* Applications Table */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Your Applications</h3>
          {loading ? (
            <TableSkeleton />
          ) : (
            <ApplicationsTable applications={applications} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => console.log("export CSV")}
            disabled={loading}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Button
            variant="gradient"
            onClick={() => console.log("make payment")}
            style={{
              backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
              color: "white",
            }}
            disabled={loading}>
            Make a Payment
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
