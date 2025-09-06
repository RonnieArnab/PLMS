import React from "react";

export const BandStat = ({ label, value }) => (
  <div className="rounded-2xl bg-white dark:bg-[#0F1723] border border-black/5 dark:border-white/10 p-5 text-center">
    <p className="text-sm text-[#6B7280] dark:text-gray-300">{label}</p>
    <p className="text-2xl font-bold text-[#0D1B2A] dark:text-white">{value}</p>
  </div>
);
