import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Section components
import { LandingNavbar } from "./landing/LandingNavbar";
import { Hero } from "./landing/Hero";
import { FeatureGrid } from "./landing/FeatureGrid";
import { AnalyticsSection } from "./landing/AnalyticsSection";
import { HowItWorks } from "./landing/HowItWorks";
import { StatsBand } from "./landing/StatsBand";
import { Testimonials } from "./landing/Testimonials";
import { FAQ } from "./landing/FAQ";
import { CTA } from "./landing/CTA";
import { SiteFooter } from "./landing/SiteFooter";
import { Handshake, TrendingUp, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  console.log("landing page-- ", isDark);

  const features = [
    {
      title: "Fast Approvals",
      description:
        "Instant eligibility checks and rapid decisions powered by intelligent rules.",
      icon: Handshake,
      colorClasses: "bg-[#E6F7F4] text-[#00BFA6]",
    },
    {
      title: "Customized Loans",
      description: "Tailored terms for professionals—fit for your goals.",
      icon: TrendingUp,
      colorClasses: "bg-[#EAF2FF] text-[#1B263B]",
    },
    {
      title: "Secure & Compliant",
      description: "Enterprise-grade security and audit-ready compliance.",
      icon: ShieldCheck,
      colorClasses: "bg-[#FFF7ED] text-[#EA580C]",
    },
  ];

  const steps = [
    { title: "Apply", body: "Submit KYC + professional details in minutes." },
    {
      title: "Assess",
      body: "Automated checks and risk scoring in real-time.",
    },
    {
      title: "Approve",
      body: "Clear terms. Transparent rates. Instant decisions.",
    },
    { title: "Disburse", body: "Fast payouts and smart repayment schedules." },
  ];

  const faqs = [
    {
      q: "Who is eligible?",
      a: "Working professionals (doctors, lawyers, engineers) with valid KYC and bank statements.",
    },
    {
      q: "How fast is approval?",
      a: "Most applications receive a decision within minutes after document verification.",
    },
    {
      q: "Is my data safe?",
      a: "We follow best practices with encryption in transit and at rest, RBAC, and audit logging.",
    },
  ];

  return (
    <div className="bg-[#F9FAFB] text-[#111827] dark:bg-[#0B1220] dark:text-white transition-colors duration-500">
      {/* pass boolean isDark and toggleTheme */}
      <LandingNavbar user={user} isDark={isDark} toggleTheme={toggleTheme} />
      <Hero user={user} />
      <FeatureGrid features={features} />
      <AnalyticsSection />
      <HowItWorks steps={steps} />
      <StatsBand />
      <Testimonials />
      <FAQ faqs={faqs} />
      <CTA user={user} />
      <SiteFooter />
    </div>
  );
}
