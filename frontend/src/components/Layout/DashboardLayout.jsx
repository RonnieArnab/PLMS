import React from "react";
import { motion } from "framer-motion";

const layoutVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const DashboardLayout = ({ children }) => {
  return (
    <motion.div
      variants={layoutVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-base-200"
    >
      <main className="max-w-7xl mx-auto">{children}</main>
    </motion.div>
  );
};