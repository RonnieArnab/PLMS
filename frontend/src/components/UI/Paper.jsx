import React from "react";
import { motion } from "framer-motion";

export function Paper({
  children,
  className = "",
  padding = "md",
  radius = "md",
  shadow = "sm",
  ...props
}) {
  const pads = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={`bg-base-100 border rounded-lg ${pads[padding]} ${className}`}
      {...props}>
      {children}
    </motion.div>
  );
}
