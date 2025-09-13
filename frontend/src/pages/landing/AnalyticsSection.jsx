import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import chartAnimation from "../../assets/chart.json";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { fadeUp } from "./motionHelpers";
import { CheckCircle } from "lucide-react";

export const AnalyticsSection = () => (
  <section id="analytics" className="py-20 bg-white dark:bg-[#0D1B2A]">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center px-4">
      <motion.div {...fadeUp(0)}>
        <Card className="w-full max-w-xl mx-auto rounded-2xl border border-black/5 dark:border-white/10 bg-[#EAF2FF] dark:bg-[#0E1A2A] p-2">
          <Lottie animationData={chartAnimation} loop />
        </Card>
      </motion.div>
      <motion.div {...fadeUp(0.1)}>
        <h2 className="text-3xl font-bold text-[#0D1B2A] dark:text-white">
          Real-Time Loan Insights
        </h2>
        <p className="mt-3 text-[#6B7280] dark:text-gray-300">
          Track disbursements, repayments, and borrower activity with clear,
          actionable dashboards. Export-ready reports and API-first access for
          your data team.
        </p>
        <ul className="mt-5 space-y-3 text-[#111827] dark:text-gray-200">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#00BFA6] mt-0.5" /> Cohort
            performance & roll rates
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#00BFA6] mt-0.5" />{" "}
            Delinquency & collections KPIs
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#00BFA6] mt-0.5" /> Plug into
            BI tools via APIs
          </li>
        </ul>
        <div className="mt-6">
          <Link to="/analytics">
            <Button className="rounded-2xl bg-[#0D1B2A] hover:bg-[#1B263B] text-white">
              View Analytics
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);
