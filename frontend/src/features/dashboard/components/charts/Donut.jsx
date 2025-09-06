import React from "react";
import { ResponsivePie } from "@nivo/pie";

export default function Donut({
  data = [],
  innerRadius = 0.6,
  dark = false,
  colors,
}) {
  const safeData = Array.isArray(data) ? data : [];
  if (!safeData.length) {
    return (
      <div
        style={{ height: 260 }}
        className="flex items-center justify-center text-base-content/60">
        No portfolio data
      </div>
    );
  }

  const palette = colors ?? [
    "#22c55e",
    "#84cc16",
    "#16a34a",
    "#bbf7d0",
    "#bef264",
    "#4ade80",
  ];

  return (
    <div style={{ height: 260, minHeight: 260 }}>
      <ResponsivePie
        data={safeData}
        innerRadius={innerRadius}
        padAngle={1}
        cornerRadius={6}
        colors={palette}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        enableArcLabels={false}
        enableArcLinkLabels={true}
        arcLinkLabelsSkipAngle={6}
        arcLinkLabelsTextColor={dark ? "#e5e7eb" : "#111827"}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        tooltip={({ datum: d }) => (
          <div style={{ padding: 8 }}>
            <div style={{ fontWeight: 700 }}>{d.id}</div>
            <div style={{ color: "#6b7280", marginTop: 4 }}>
              ₹{Number(d.value).toLocaleString("en-IN")}
            </div>
          </div>
        )}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 36,
            itemsSpacing: 8,
            itemWidth: 110,
            itemHeight: 20,
            itemTextColor: dark ? "#e5e7eb" : "#374151",
            symbolSize: 10,
          },
        ]}
      />
    </div>
  );
}
