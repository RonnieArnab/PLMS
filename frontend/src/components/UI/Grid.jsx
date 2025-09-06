import React from "react";

export const Grid = ({ children, className = "", cols = 1, gap = "md" }) => {
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

  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export const GridCol = ({ children, className = "", span = 1 }) => {
  const spanClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-4",
    6: "col-span-1 md:col-span-3 lg:col-span-6",
    12: "col-span-1 md:col-span-6 lg:col-span-12",
  };

  return <div className={`${spanClasses[span]} ${className}`}>{children}</div>;
};

export default Grid;
