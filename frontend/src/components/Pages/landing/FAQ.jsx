import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp } from "./motionHelpers";

export const FAQ = ({ faqs }) => (
  <section id="faq" className="py-16">
    <div className="max-w-5xl mx-auto px-4">
      <motion.h2
        {...fadeUp(0)}
        className="text-3xl md:text-4xl font-bold text-center text-[#0D1B2A] dark:text-white">
        Frequently asked questions
      </motion.h2>
      <div className="mt-8 space-y-4">
        {faqs.map((f, i) => (
          <motion.details
            key={f.q}
            {...fadeUp(i * 0.04)}
            className="group rounded-2xl bg-white dark:bg-[#0F1723] border border-black/5 dark:border-white/10 p-5">
            <summary className="cursor-pointer list-none flex items-center justify-between">
              <span className="font-medium text-[#0D1B2A] dark:text-white">
                {f.q}
              </span>
              <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-[#6B7280] dark:text-gray-300">{f.a}</p>
          </motion.details>
        ))}
      </div>
    </div>
  </section>
);
