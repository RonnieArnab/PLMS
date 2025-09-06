// src/components/ui/Grid.jsx
import React from "react";

/**
 * Grid - responsive grid helper
 * props:
 *  - cols: 1|2|3|4|6|12|16  (number or string)
 *  - gap: "none"|"sm"|"md"|"lg"|"xl"
 *  - className: extra classes
 */
export const Grid = ({
  children,
  className = "",
  cols = 1,
  gap = "md",
  style,
}) => {
  const n = typeof cols === "string" ? Number(cols) : cols;
  const safeCols = [1, 2, 3, 4, 6, 12, 16].includes(n) ? n : 1;

  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
    12: "grid-cols-1 md:grid-cols-6 lg:grid-cols-12",
    16: "grid-cols-1 md:grid-cols-6 lg:grid-cols-16",
  };

  const gapClasses = {
    none: "",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const gapClass = gapClasses[gap] ?? gapClasses.md;
  const colsClass = colClasses[safeCols] ?? colClasses[1];

  return (
    <div
      role="grid"
      data-grid-cols={safeCols}
      className={`grid ${colsClass} ${gapClass} ${className}`}
      style={style}>
      {children}
    </div>
  );
};

/**
 * GridCol - span helper (simple)
 * - span: 1..12 (number or string). Will map to responsive spans where possible.
 */
export const GridCol = ({ children, className = "", span = 1, style }) => {
  const s = typeof span === "string" ? Number(span) : span;
  const safeSpan = Number.isFinite(s) && s > 0 ? Math.min(s, 12) : 1;

  // simple responsive span mapping: small screens full width, medium + as needed
  // For more complex needs you can pass className directly.
  const spanClass =
    safeSpan === 1
      ? "col-span-1"
      : safeSpan <= 2
      ? "col-span-1 md:col-span-2"
      : safeSpan <= 3
      ? "col-span-1 md:col-span-2 lg:col-span-3"
      : safeSpan <= 4
      ? "col-span-1 md:col-span-2 lg:col-span-4"
      : safeSpan <= 6
      ? "col-span-1 md:col-span-3 lg:col-span-6"
      : "col-span-1 md:col-span-6 lg:col-span-12";

  return (
    <div className={`${spanClass} ${className}`} style={style}>
      {children}
    </div>
  );
};

export default Grid;
