import React from "react";
import { motion } from "framer-motion";

const base = "font-sans antialiased tracking-tight";

export function Text({
  children,
  size = "base",
  weight = "normal",
  variant = "paragraph",
  className = "",
  as: Component = "p",
  ...props
}) {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };
  const weights = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  const variants = {
    heading: `leading-tight ${sizes["2xl"]} font-semibold`,
    subheading: `leading-snug ${sizes.xl}`,
    lead: `text-lg font-medium`,
    paragraph: `leading-relaxed ${sizes[size]}`,
    label: `uppercase tracking-wide text-xs font-medium`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}>
      <Component
        className={`${base} ${variants[variant] || variants.paragraph} ${
          sizes[size]
        } ${weights[weight]} ${className}`}
        {...props}>
        {children}
      </Component>
    </motion.div>
  );
}
