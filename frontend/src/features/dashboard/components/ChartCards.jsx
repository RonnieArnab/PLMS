// ChartCards.jsx
import React, { useId } from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import AreaLine from "./charts/AreaLine.jsx";
import Donut from "./charts/Donut.jsx";
import { Eye } from "lucide-react";
import Grid, { GridCol } from "@components/ui/Grid.jsx"; // default + named GridCol

/* small defensive sparkline with unique gradient id */
function Sparkline({
  values = [],
  width = 84,
  height = 28,
  stroke = "#16a34a",
}) {
  const uid =
    typeof useId === "function" ? useId() : String(Math.random()).slice(2);
  const gradId = `sparkGrad-${uid}`;
  const safe = Array.isArray(values) ? values : [];
  if (!safe.length) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect x="0" y="0" width={width} height={height} rx="6" fill="#f3f4f6" />
      </svg>
    );
  }
  const max = Math.max(...safe);
  const min = Math.min(...safe);
  const range = max - min || 1;
  const stepX = width / Math.max(1, safe.length - 1);

  const points = safe
    .map((v, i) => {
      const x = +(i * stepX).toFixed(2);
      const y = +((1 - (v - min) / range) * (height - 6) + 3).toFixed(2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="100%" stopColor={stroke} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);

export default function ChartCards({
  lineData = [],
  pieData = [],
  portfolio = [],
  isDark = false,
}) {
  // defensive defaults
  const safeLineData = Array.isArray(lineData) ? lineData : [];
  const safePie = Array.isArray(pieData) ? pieData : [];
  const safePortfolio = Array.isArray(portfolio) ? portfolio : [];

  if (
    !Array.isArray(lineData) ||
    !Array.isArray(pieData) ||
    !Array.isArray(portfolio)
  ) {
    // helpful dev-time warning; safe arrays used below so UI won't crash
    // eslint-disable-next-line no-console
    console.warn("ChartCards received non-array data — using safe defaults", {
      lineData,
      pieData,
      portfolio,
    });
  }

  // pick primary series safely
  const series =
    safeLineData.length && Array.isArray(safeLineData[0].data)
      ? safeLineData[0].data
      : [];

  const sparkValues = series.map((d) => Number(d?.y || 0)).slice(-6);
  const avg = series.length
    ? Math.round(
        series.reduce((s, p) => s + Number(p.y || 0), 0) / series.length
      )
    : 0;
  const highest = series.length
    ? Math.max(...series.map((p) => Number(p.y || 0)))
    : 0;

  // brand color palette (lime / green family)
  const donutColors = ["#84cc16", "#22c55e", "#16a34a", "#bef264", "#bbf7d0"];

  return (
    <Grid cols={1} className="gap-6">
      <MotionFadeIn>
        <GridCol span={1}>
          <Card className="p-5 rounded-lg shadow-sm min-h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Payment History</h3>
                <Text variant="muted" className="text-sm">
                  Last 6 months — trend & month-by-month breakdown
                </Text>
              </div>
              <div className="text-sm text-base-content/60">Trend</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-2">
                <Text variant="muted" className="text-xs">
                  Avg monthly
                </Text>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    ₹{avg.toLocaleString("en-IN")}
                  </div>
                  <Sparkline values={sparkValues} />
                </div>
              </div>

              <div className="p-2">
                <Text variant="muted" className="text-xs">
                  Highest
                </Text>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    ₹{highest.toLocaleString("en-IN")}
                  </div>
                  <Sparkline values={sparkValues} />
                </div>
              </div>

              <div className="p-2">
                <Text variant="muted" className="text-xs">
                  Months
                </Text>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{series.length}</div>
                  <Sparkline values={sparkValues} />
                </div>
              </div>
            </div>

            <div className="flex-1">
              {safeLineData.length ? (
                <AreaLine data={safeLineData} dark={isDark} />
              ) : (
                <div className="h-[260px] flex items-center justify-center text-sm text-base-content/60">
                  No trend data available
                </div>
              )}
            </div>
          </Card>
        </GridCol>
      </MotionFadeIn>

      <MotionFadeIn>
        <GridCol span={1}>
          <Card className="p-5 rounded-lg shadow-sm min-h-[360px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Portfolio Breakdown</h3>
              <Button variant="ghost" size="sm" className="p-2">
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[340px]">
                {safePie.length ? (
                  <Donut
                    data={safePie}
                    dark={isDark}
                    innerRadius={0.64}
                    colors={donutColors}
                  />
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-base-content/60">
                    No portfolio data
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {safePortfolio.length ? (
                safePortfolio.map((item, idx) => (
                  <div
                    key={item.name || idx}
                    className="flex items-center justify-between bg-base-200/40 rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{
                          background:
                            donutColors[idx % donutColors.length] ||
                            donutColors[0],
                        }}
                      />
                      <Text className="font-medium">{item.name}</Text>
                    </div>
                    <Text className="font-semibold">
                      ₹{Number(item.value).toLocaleString("en-IN")}
                    </Text>
                  </div>
                ))
              ) : (
                <div className="text-center text-base-content/60 py-4">
                  No portfolio items
                </div>
              )}
            </div>
          </Card>
        </GridCol>
      </MotionFadeIn>
    </Grid>
  );
}
