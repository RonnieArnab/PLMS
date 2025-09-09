// src/features/dashboard/components/StatCard.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Text } from "@components/ui/Text.jsx";

/**
 * StatCard (simplified)
 *
 * Props:
 *  - title: string
 *  - value: string|number
 *  - subtitle?: string
 *  - icon?: ReactNode
 *  - color?: string (daisyui color name like "lime", "emerald", "primary")
 *  - loading?: boolean
 *  - className?: string
 *
 * This component intentionally matches the earlier dashboard look:
 *  - small icon in rounded square on top-left
 *  - label + large value on the right
 *  - optional subtitle below value
 *  - includes internal loading UI when `loading` is true
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon = null,
  color = "lime",
  loading = false,
  className = "",
}) {
  // normalize value for display (keep currency formatting if number)
  const displayValue = useMemo(() => {
    if (value == null || value === "") return "-";
    if (typeof value === "number") return `₹${value.toLocaleString("en-IN")}`;
    return String(value);
  }, [value]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card bg-base-100 shadow-md border border-base-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-base-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-36 bg-base-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-24 bg-base-200 rounded animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`card bg-base-100 shadow-md border border-base-200 rounded-xl ${className}`}>
      <div className="card-body p-4 flex items-start gap-4">
        {/* Icon block */}
        {icon ? (
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-lg shrink-0`}
            style={{
              background:
                color === "emerald"
                  ? "rgba(16,185,129,0.08)"
                  : color === "primary"
                  ? "rgba(59,130,246,0.08)"
                  : "rgba(132,204,22,0.08)",
              color:
                color === "emerald"
                  ? "#10B981"
                  : color === "primary"
                  ? "#3B82F6"
                  : "#84cc16",
            }}
            aria-hidden>
            {icon}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-base-200 shrink-0" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-base-content/70 font-medium">
                {title}
              </div>
              <div className="mt-2 text-2xl md:text-3xl font-extrabold text-base-content">
                {displayValue}
              </div>
              {subtitle && (
                <div className="text-xs text-base-content/60 mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
