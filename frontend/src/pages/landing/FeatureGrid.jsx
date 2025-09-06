import React from "react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { ArrowRight } from "lucide-react";
import { fadeUp, staggerParent, staggerChild } from "./motionHelpers";

export const FeatureGrid = ({ features }) => (
  <section id="features" className="py-16">
    <div className="max-w-7xl mx-auto px-4">
      <motion.h2
        {...fadeUp(0)}
        className="text-3xl md:text-4xl font-bold text-[#0D1B2A] dark:text-white text-center">
        Purpose-built Features
      </motion.h2>
      <motion.p
        {...fadeUp(0.1)}
        className="mt-2 text-center text-[#6B7280] dark:text-gray-300 max-w-2xl mx-auto">
        Everything you need to originate, service, and analyze loans—without
        friction.
      </motion.p>
      <motion.div
        variants={staggerParent}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(({ title, description, icon: Icon, colorClasses }) => (
          <motion.div key={title} variants={staggerChild}>
            <Card className="h-full p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0F1723] hover:shadow-xl transition-transform hover:-translate-y-1">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[#0D1B2A] dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-[#6B7280] dark:text-gray-300">
                {description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-[#00BFA6]">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
