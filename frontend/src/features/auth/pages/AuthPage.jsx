import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "@features/auth/components/LoginForm";
import { SignupForm } from "@features/auth/components/SignupForm";
import heroAnimation from "@assets/hero-loan.json";
import Lottie from "lottie-react";
export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin((prev) => !prev);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side - Branding */}

      <motion.div
        className="hidden lg:flex relative flex-col justify-center items-center 
             bg-gradient-to-br from-green-600 to-green-800 text-white px-12 overflow-hidden">
        {/* Branding Content */}
        <h1 className="text-6xl font-extrabold mb-6 relative z-10">ProLoan</h1>
        <p className="text-lg opacity-90 max-w-md text-center relative z-10">
          Manage your loans smarter, track repayments, and stay in control of
          your finances with ease.
        </p>
        <div className="mt-10 relative z-10">
          <Lottie animationData={heroAnimation} loop />
        </div>
      </motion.div>

      {/* Right side - Auth Form */}
      <div className="flex items-center justify-center bg-gray-50 px-6 lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <SignupForm onToggleMode={toggleMode} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
