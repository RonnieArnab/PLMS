import React from "react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { fadeUp } from "./motionHelpers";

export const HowItWorks = ({ steps }) => (
  <section id="how" className="py-16">
    <div className="max-w-7xl mx-auto px-4">
      <motion.h2
        {...fadeUp(0)}
        className="text-3xl md:text-4xl font-bold text-center text-[#0D1B2A] dark:text-white">
        How it works
      </motion.h2>
      <motion.p
        {...fadeUp(0.1)}
        className="mt-2 text-center text-[#6B7280] dark:text-gray-300 max-w-2xl mx-auto">
        From application to disbursement, every step is fast, compliant, and
        transparent.
      </motion.p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map((s, idx) => (
          <motion.div key={s.title} {...fadeUp(idx * 0.05)}>
            <Card className="h-full p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0F1723]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E6F7F4] text-[#00BFA6] font-semibold">
                {idx + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0D1B2A] dark:text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-[#6B7280] dark:text-gray-300">{s.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
