import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { fadeUp } from "./motionHelpers";

export const CTA = ({ user }) => (
  <section className="relative overflow-hidden py-20">
    <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A] opacity-95" />
    <div className="relative max-w-7xl mx-auto px-4 text-center text-white">
      <motion.h2 {...fadeUp(0)} className="text-4xl font-extrabold">
        Ready to grow?
      </motion.h2>
      <motion.p
        {...fadeUp(0.1)}
        className="mt-3 max-w-2xl mx-auto text-white/80">
        Unlock the potential of your lending operations with quick, reliable
        financing workflows.
      </motion.p>
      <motion.div {...fadeUp(0.2)} className="mt-8 flex justify-center gap-3">
        {!user && (
          <Link to="/auth">
            <Button className="rounded-2xl bg:white text-[#0D1B2A] hover:bg-gray-100">
              Start Your Application
            </Button>
          </Link>
        )}
        <Link to="/contact">
          <Button
            variant="outline"
            className="rounded-2xl border-white text-white hover:bg-white/10">
            Book a Demo
          </Button>
        </Link>
      </motion.div>
    </div>
  </section>
);
