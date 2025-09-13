import React from "react";
import { motion } from "framer-motion";

export function Card({ children, className = "", padding = "md" }) {
  const pads = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={`card bg-base-100 shadow-sm border border-base-200 rounded-xl ${pads[padding]} ${className}`}>
      {children}
    </motion.div>
  );
}
