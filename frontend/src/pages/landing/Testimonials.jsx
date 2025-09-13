import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { fadeUp } from "./motionHelpers";

export const Testimonials = () => {
  const items = [
    {
      body: "We reduced approval time from days to minutes. The API-first approach made integration painless.",
      author: "CTO, MedFin Partners",
    },
    {
      body: "Visibility across the portfolio improved collections by 12%. The dashboards are gold.",
      author: "Head of Risk, ProCredit",
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-[#0D1B2A]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2
          {...fadeUp(0)}
          className="text-3xl md:text-4xl font-bold text-center text-[#0D1B2A] dark:text-white">
          Loved by modern lenders
        </motion.h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((t, i) => (
            <motion.blockquote
              key={i}
              {...fadeUp(i * 0.05)}
              className="rounded-2xl border border-black/5 dark:border-white/10 p-6 bg-[#F9FAFB] dark:bg-[#0F1723]">
              <Quote className="w-6 h-6 text-[#00BFA6]" />
              <p className="mt-3 text-[#111827] dark:text-gray-100">{t.body}</p>
              <footer className="mt-4 text-sm text-[#6B7280] dark:text-gray-300">
                {t.author}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};
