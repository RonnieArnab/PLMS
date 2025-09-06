import React from "react";
import CountUp from "react-countup";

export const Stat = ({ label, value, suffix = "", color = "#111827" }) => (
  <div className="p-4 rounded-2xl glass-card shadow-sm">
    <p className="text-sm text-[#6B7280] dark:text-gray-300">{label}</p>
    <p className="text-3xl font-extrabold" style={{ color }}>
      <CountUp end={value} duration={2.2} />
      {suffix}
    </p>
  </div>
);
