// src/features/auth/pages/VerifyFailedPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { AlertCircle } from "lucide-react";
import { Text } from "@components/ui/Text.jsx";
import api from "@api/api";

export default function VerifyFailedPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const reason = params.get("reason") || "invalid_token";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    // Ask the user for their email (simple prompt). You can replace with a proper input UI.
    const email = window.prompt(
      "Please enter your email to resend verification:"
    );
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/api/auth/resend-verification", { email });
      setMessage("Verification email resent. Please check your inbox.");
    } catch (err) {
      setMessage("Could not resend verification — try again later.");
      // optionally parse server error here
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionFadeIn>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Paper className="rounded-2xl p-6 max-w-md text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold mt-4">
            Email verification failed
          </h2>

          <Text variant="muted" className="mt-2">
            We couldn't verify your email. Reason: <strong>{reason}</strong>.
          </Text>

          <div className="mt-4 text-sm text-slate-600">
            <p>
              If the link expired or is invalid, click{" "}
              <strong>Resend verification</strong> below or try signing in to
              request another email.
            </p>
          </div>

          {message && (
            <div className="mt-3 p-2 rounded bg-green-50 text-emerald-700">
              {message}
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 rounded border">
              Sign in
            </button>
            <button
              onClick={handleResend}
              disabled={loading}
              className="px-4 py-2 rounded bg-lime-600 text-white">
              {loading ? "Sending..." : "Resend verification"}
            </button>
          </div>
        </Paper>
      </div>
    </MotionFadeIn>
  );
}
