// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import HeaderHero from "@features/dashboard/components/HeaderHero.jsx"; // adjust path
import ChartCards from "@features/dashboard/components/ChartCards.jsx"; // adjust path
import StatCard from "@features/dashboard/components/StatCard.jsx"; // adjust path
import { Grid } from "@components/ui/Grid.jsx";
import { Download } from "lucide-react";

/**
 * Small skeleton components used while loading
 */
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
      <div className="mb-4">
        <div className="h-6 w-1/3 bg-base-200 rounded animate-pulse" />
      </div>
      <div
        className={`flex-1 bg-base-200/50 rounded animate-pulse`}
        style={{ height }}
      />
    </Card>
  );
}

/**
 * Example mock data generator (replace with real fetch)
 */
function fetchMockDashboard() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        kpis: [
          {
            id: "outstanding",
            label: "Total Outstanding",
            value: 221940,
            series: [2000, 2100, 2500, 2500, 2500, 2500],
          },
          {
            id: "monthly",
            label: "Monthly Payment",
            value: 2500,
            series: [2500, 2500, 2500, 2500, 2500, 2500],
          },
          {
            id: "next",
            label: "Next Payment",
            value: "Sep 15",
            series: [0, 0, 0, 0, 0, 0],
          },
        ],
        lineData: [
          {
            id: "payments",
            name: "Payments",
            data: [
              { x: "Jan", y: 2500 },
              { x: "Feb", y: 2500 },
              { x: "Mar", y: 2500 },
              { x: "Apr", y: 2500 },
              { x: "May", y: 2500 },
              { x: "Jun", y: 2500 },
            ],
          },
        ],
        pieData: [
          { label: "Equipment Loan", value: 50000 },
          { label: "Office Setup", value: 75000 },
        ],
        portfolio: [
          { name: "Equipment Loan", value: 50000 },
          { name: "Office Setup", value: 75000 },
        ],
      });
    }, 900); // simulate network latency
  });
}

export function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMockDashboard().then((data) => {
      if (!mounted) return;
      setDashboard(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = useMemo(() => dashboard?.kpis ?? [], [dashboard]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <HeaderHero
        onApply={() => {
          console.log("apply clicked");
        }}
      />

      {/* KPI row */}
      <Grid cols={3} className="gap-6">
        {loading ? (
          // show three skeletons
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          kpis.map((k) => (
            <MotionFadeIn key={k.id}>
              {/* If you have a StatCard component, use it; otherwise this example shows a small card. */}
              <StatCard
                title={k.label}
                value={
                  typeof k.value === "number"
                    ? `₹${k.value.toLocaleString("en-IN")}`
                    : k.value
                }
                subtitle={k.subtitle}
                sparkData={k.series}
              />
            </MotionFadeIn>
          ))
        )}
      </Grid>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCards
              lineData={dashboard.lineData}
              pieData={dashboard.pieData}
              portfolio={dashboard.portfolio}
              isDark={false}
            />
          </>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            // download all
            console.log("export");
          }}
          disabled={loading}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>

        <Button
          variant="gradient"
          onClick={() => {
            console.log("make payment or go to payments");
          }}
          style={{
            backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
            color: "white",
          }}
          disabled={loading}>
          Make a Payment
        </Button>
      </div>
    </div>
  );
}
