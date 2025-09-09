// AuthPage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "@features/auth/components/LoginForm";
import SignupForm from "@features/auth/components/SignupForm.jsx";
import Lottie from "lottie-react";
import heroAnimation from "@assets/hero-loan.json"; // keep your existing Lottie file
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Brand hero */}
      <motion.div
        className="hidden lg:flex relative flex-col justify-center items-center
             px-12 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}>
        {/* gradient background */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 10% 20%, rgba(132,204,22,0.12), transparent 15%), linear-gradient(180deg, rgba(34,197,94,0.12), rgba(132,204,22,0.04))",
            zIndex: 0,
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
          <h1 className="text-5xl font-extrabold text-slate-900">ProLoan</h1>
          <p className="max-w-xl text-lg text-slate-700">
            Manage your loans smarter — track repayments, download receipts, and
            apply for new loans in a few quick steps.
          </p>

          <div className="w-full max-w-md">
            <MotionFadeIn>
              <Lottie animationData={heroAnimation} loop />
            </MotionFadeIn>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-4 rounded-xl bg-white/80 shadow">
              <div className="text-sm text-slate-500">Secure</div>
              <div className="font-semibold">PCI & KYC</div>
            </div>
            <div className="p-4 rounded-xl bg-white/80 shadow">
              <div className="text-sm text-slate-500">Fast</div>
              <div className="font-semibold">Instant Decisions</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right: Auth form */}
      <div className="flex items-center justify-center bg-gray-50 px-6 lg:px-16 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-lg">
            {isLogin ? (
              <LoginForm onToggleMode={() => setIsLogin(false)} />
            ) : (
              <SignupForm onToggleMode={() => setIsLogin(true)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
