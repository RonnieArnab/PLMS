import React from "react";
import { DollarSign, Linkedin, Twitter, Facebook } from "lucide-react";

export const SiteFooter = () => (
  <footer className="bg-[#0D1B2A] text-white">
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#00BFA6]">
            <DollarSign className="w-5 h-5 text-[#0D1B2A]" />
          </div>
          <span className="font-semibold tracking-tight">ProLoan</span>
        </div>
        <p className="mt-3 text-white/70">
          Professional Loan Management—built for speed, clarity, and security.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold">Product</h4>
          <ul className="mt-3 space-y-2 text-white/80">
            <li>
              <a href="#features" className="hover:underline">
                Features
              </a>
            </li>
            <li>
              <a href="#analytics" className="hover:underline">
                Analytics
              </a>
            </li>
            <li>
              <a href="#how" className="hover:underline">
                How it works
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline">
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-white/80">
            <li>
              <a href="#" className="hover:underline">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <h4 className="font-semibold">Follow</h4>
        <div className="mt-3 flex gap-4 text-white/80">
          <a href="#" className="hover:text-white" aria-label="LinkedIn">
            <Linkedin />
          </a>
          <a href="#" className="hover:text-white" aria-label="Twitter">
            <Twitter />
          </a>
          <a href="#" className="hover:text-white" aria-label="Facebook">
            <Facebook />
          </a>
        </div>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-white/60 flex flex-col md:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} ProLoan. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">
            Privacy
          </a>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <a href="#" className="hover:underline">
            Security
          </a>
        </div>
      </div>
    </div>
  </footer>
);
