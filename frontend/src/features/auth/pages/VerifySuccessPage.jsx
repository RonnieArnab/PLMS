// src/features/auth/pages/VerifySuccessPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { CheckCircle } from "lucide-react";
import { Text } from "@components/ui/Text.jsx";
import { useAuth } from "@context/AuthContext";

/**
 * VerifySuccessPage
 * - Backend typically redirects here after successful verification.
 * - This page attempts restoreSession() (using refresh cookie) and then navigates to `next`.
 */
export default function VerifySuccessPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const next = params.get("next") || "/profile/details";
  const { restoreSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function finish() {
      setLoading(true);
      setError(null);
      try {
        // Try to restore the session (backend should have set refresh cookie on verification)
        const res = await restoreSession();
        if (mounted && res?.ok && res.user) {
          // If `next` is an absolute URL, do a full page navigation so the browser
          // will correctly navigate to external pages. Otherwise use SPA navigation.
          const decodedNext = decodeURIComponent(next);
          if (/^https?:\/\//i.test(decodedNext)) {
            window.location.href = decodedNext;
          } else {
            // ensure path starts with '/'
            const path = decodedNext.startsWith("/")
              ? decodedNext
              : `/${decodedNext}`;
            navigate(path);
          }
          return;
        } else {
          setError(
            "Could not automatically sign you in. Please sign in manually."
          );
        }
      } catch (err) {
        setError(
          "Could not automatically sign you in. Please sign in manually."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    finish();
    return () => (mounted = false);
  }, [restoreSession, navigate, next]);

  return (
    <MotionFadeIn>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Paper className="rounded-2xl p-6 max-w-md text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-lime-50 flex items-center justify-center text-lime-700">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold mt-4">Email verified</h2>
          <Text variant="muted" className="mt-2">
            {loading
              ? "Finishing sign-in..."
              : error || "Thanks — your email is verified. Redirecting..."}
          </Text>

          {error ? (
            <div className="mt-6 flex gap-2 justify-center">
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 rounded bg-lime-600 text-white font-medium">
                Go to sign in
              </button>
            </div>
          ) : (
            <div className="mt-6 text-sm text-slate-600">
              If you are not redirected automatically,{" "}
              <button
                onClick={() => {
                  const decodedNext = decodeURIComponent(next);
                  if (/^https?:\/\//i.test(decodedNext)) {
                    window.location.href = decodedNext;
                  } else {
                    navigate(
                      decodedNext.startsWith("/")
                        ? decodedNext
                        : `/${decodedNext}`
                    );
                  }
                }}
                className="underline text-lime-600">
                continue
              </button>
              .
            </div>
          )}
        </Paper>
      </div>
    </MotionFadeIn>
  );
}
