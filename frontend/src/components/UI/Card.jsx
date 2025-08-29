import React from "react";

export const Card = ({ children, className = "", padding = "md" }) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};
