// src/features/auth/components/VerifyEmailPage.jsx
import React, { useEffect } from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Mail } from "lucide-react";
import { Text } from "@components/ui/Text.jsx";
import { useAuth } from "@context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * VerifyEmailPage
 * - Shows after signup.
 * - Polls /auth/refresh every 3s to auto-redirect after user verifies.
 *
 * Props:
 *  - email
 *  - onVerified() optional
 */
export default function VerifyEmailPage({ email, onVerified = null }) {
  const { restoreSession, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let interval = null;

    // single function to check server-side session / verification
    const runCheck = async () => {
      try {
        // restoreSession should call /api/auth/refresh or equivalent and return { ok, user }
        const r = await restoreSession();
        if (!mounted) return;

        // if backend restored session and user is verified
        if (r?.ok && r.user && r.user.email_verified) {
          // prefer callback from parent
          if (typeof onVerified === "function") {
            onVerified();
          } else {
            // When restoreSession succeeded and user is verified, navigate to details.
            // In some deployments you may prefer to route via /verify-success to ensure cookie behavior.
            // If you want backend flow instead, replace the next line with:
            // window.location.href = '/verify-success?next=/profile/details';
            navigate("/profile/details");
          }
        }
      } catch {
        // ignore errors while waiting for verification
      }
    };

    // run immediately and then poll
    runCheck();
    interval = setInterval(runCheck, 3000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [restoreSession, onVerified, navigate]);

  // Also react to user object changes from context (fast-path)
  useEffect(() => {
    if (!user) return;
    if (user.email_verified) {
      if (typeof onVerified === "function") onVerified();
      else navigate("/profile/details");
    }
  }, [user, onVerified, navigate]);

  return (
    <MotionFadeIn>
      <Paper className="rounded-2xl p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-lime-50 text-lime-700 shadow-sm">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold mt-3">Verify your email</h2>
        <Text variant="muted" className="mt-2">
          We’ve sent a verification link to:
        </Text>
        <div className="font-medium mt-1">{email}</div>
        <Text variant="muted" className="mt-4">
          Please check your inbox (and spam). After verification you’ll be asked
          to complete your customer details (PAN, Aadhaar, bank).
        </Text>
      </Paper>
    </MotionFadeIn>
  );
}
