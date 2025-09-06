import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function Button({
  variant = "primary", // primary | secondary | ghost | outline
  size = "md", // sm | md | lg
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) {
  const sizes = {
    sm: "btn-sm px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variants = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    ghost: "btn btn-ghost",
    outline: "btn btn-outline",
  };
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`${variants[variant] || variants.primary} ${
        sizes[size] || sizes.md
      } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      disabled={isDisabled}
      {...props}>
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </motion.button>
  );
}
