import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import HeaderHero from "@features/dashboard/components/HeaderHero.jsx";
import StatCard from "@features/dashboard/components/StatCard.jsx";
import ChartCards from "@features/dashboard/components/ChartCards.jsx";
import ApplicationsTable from "@features/dashboard/components/ApplicationsTable.jsx";
import { Grid } from "@components/ui/Grid.jsx";
import { Button } from "@components/ui/Button.jsx";
import { useAuth } from "@context/AuthContext";
import { useTheme } from "@context/ThemeContext";
import {
  fetchDashboardStats,
  initializeStats,
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

// ✅ Skeleton loaders omitted for brevity — same as your code
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

const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);

export function UserDashboard() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customData, setCustomData] = useState([]);
  const [glimpseLoading, setGlimpseLoading] = useState(false);

  const { isDark } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      if (user?.id) {
        await initializeStats(user.id); // ✅ Ensure stats are initialized first

        const s = await fetchDashboardStats(); // ✅ Fetch updated stats after init
        const a = await fetchLoanApplications(user.id);
       console.log("normalized apps:", a);
        const p = await apiHandler(fetchPaymentHistory, [
          { month: "Jan", amount: 20000 },
          { month: "Feb", amount: 25000 },
          { month: "Mar", amount: 23000 },
          { month: "Apr", amount: 28000 },
          { month: "May", amount: 32000 },
          { month: "Jun", amount: 25000 },
        ]);
        const b = await apiHandler(async () => {
          const res = await fetch(
            `http://localhost:4000/api/loan-applications/user/${user.id}`
          );
          const json = await res.json();
          const data = json.data || [];
          const mapped = data.map((item) => ({
            name: item.product_name,
            value: Number(item.loan_amount),
          }));
          setCustomData(mapped);
          return mapped;
        }, []);

        if (mounted) {
          setStats(s);
          setApplications(a);
          setPayments(p);
          setPortfolio(b);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const lineData = useMemo(
    () => [
      {
        id: "Payments",
        data: (payments || []).map((p) => ({
          x: p.month || p.date || "-",
          y: p.amount || p.payment_amount || 0,
        })),
      },
    ],
    [payments]
  );

  const pieData = useMemo(
    () => (portfolio || []).map((p) => ({ id: p.name, value: p.value })),
    [portfolio]
  );

  const iconMap = {
    "Active Loans": Layers,
    "Total Borrowed": TrendingUp,
    "Pending Applications": Clock,
    "Credit Score": CheckCircle,
  };

  const loansGlimpse = Array.isArray(applications) ? applications.slice(0, 5) : [];
  const paymentsGlimpse = Array.isArray(payments) ? payments.slice(0, 5) : [];

  const getLoanId = (loan) => loan?.id || loan?.loan_id || loan?.application_id || null;
  const getLoanTitle = (loan, idx) =>
    loan?.product_name || loan?.loan_product || loan?.purpose || `Loan ${getLoanId(loan) || idx + 1}`;
  const getPaymentId = (p) => p?.payment_id || p?.id || null;
  const getPaymentDesc = (p, idx) => p?.description || p?.note || p?.month || `Payment ${getPaymentId(p) || idx + 1}`;


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
          <h3 className="text-lg font-semibold mb-3">     Your Loans</h3>
          {loading ? (
            <TableSkeleton />
          ) : (
            <ApplicationsTable applications={applications} />
          )}
        </div>

        {/* NEW: Glimpse Row for My Loans & Payments (clickable) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold">Recent Payments (glimpse)</h4>
              <div className="text-sm text-gray-500">
                {paymentsGlimpse.length} shown
              </div>
            </div>

            {glimpseLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : paymentsGlimpse.length === 0 ? (
              <div className="text-sm text-gray-500">No payments found.</div>
            ) : (
              <ul className="space-y-2">
                {paymentsGlimpse.map((pay, i) => {
                  const payId = getPaymentId(pay);
                  const desc = getPaymentDesc(pay, i);
                  const detailUrl = payId ? `/payments#payments-section-${payId}` : "/payments#payments-section";
                  const amount = pay?.amount || pay?.payment_amount || pay?.paid_amount || 0;

                  return (
                    <li key={payId || i} className="border rounded p-0">
                      <a
                        href={detailUrl}
                        className="flex justify-between items-center no-underline hover:bg-base-200/60 p-3 rounded"
                      >
                        <div>
                          <div className="font-medium text-sm text-current">{desc}</div>
                          <div className="text-xs text-gray-500">{/* optional subtext */}</div>
                        </div>
                        <div className="text-xs text-gray-600">₹{inr(amount)}</div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-3 text-right">
              <a href="/payments#payments-section" className="text-sm text-indigo-600 hover:underline">
                View all payments →
              </a>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => console.log("export CSV")}
            disabled={loading}
          >
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
            disabled={loading}
          >
            Make a Payment
          </Button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Showing up to 5 recent items from each list. Click into the Loans or Payments pages for full details.
        </div>
      </div>
    </DashboardLayout>
  );
}
export default UserDashboard;
