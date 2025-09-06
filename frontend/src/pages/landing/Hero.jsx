import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import heroAnimation from "../../assets/hero-loan.json";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { fadeUp } from "./motionHelpers";
import { Stat } from "./Stat";

export const Hero = ({ user }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#00BFA6] to-[#1B263B] opacity-10 blur-3xl" />
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center px-4 pt-16 pb-10">
        <motion.div
          {...fadeUp(0)}
          className="order-2 md:order-1 glass-card p-8 rounded-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Smarter Loan Management for Professionals
          </h1>
          <p className="mt-4 text-lg text-[#6B7280] dark:text-gray-300">
            Streamline applications, approvals, and repayments with a secure,
            transparent platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {!user && (
              <Link to="/auth">
                <Button className="rounded-2xl bg-[#00BFA6] hover:bg-[#00A48E] text-white">
                  Get Started
                </Button>
              </Link>
            )}
            <Link to="/contact">
              <Button
                variant="outline"
                className="rounded-2xl border-[#0D1B2A] text-[#0D1B2A] dark:border-white dark:text-white">
                Talk to an Expert
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-6">
            <Stat
              label="Loans Processed"
              value={1000}
              suffix="+"
              color="#00BFA6"
            />
            <Stat label="Approval Rate" value={98} suffix="%" color="#1B263B" />
            <Stat
              label="Avg. Time to YES"
              value={3}
              suffix=" min"
              color="#0D1B2A"
            />
          </div>
        </motion.div>
        <motion.div {...fadeUp(0.15)} className="order-1 md:order-2">
          <div className="w-full max-w-xl mx-auto">
            <Lottie animationData={heroAnimation} loop />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
