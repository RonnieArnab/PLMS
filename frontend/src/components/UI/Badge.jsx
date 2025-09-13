import React from "react";
import { motion } from "framer-motion";

export function Badge({
  children,
  variant = "ghost",
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: "text-xs px-2 py-0.5 rounded-md",
    md: "text-sm px-3 py-1 rounded-lg",
    lg: "text-base px-4 py-1.5 rounded-xl",
  };

  const variants = {
    ghost: "badge badge-ghost",
    primary: "badge badge-primary",
    success: "badge badge-success",
    warning: "badge badge-warning",
    error: "badge badge-error",
    neutral: "badge badge-neutral",
  };

  return (
    <motion.span
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={`${variants[variant] || variants.ghost} ${
        sizes[size]
      } inline-flex items-center justify-center gap-2 tracking-wide shadow-sm ${className}`}>
      {children}
    </motion.span>
  );
}
