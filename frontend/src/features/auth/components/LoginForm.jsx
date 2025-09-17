// src/features/auth/components/LoginForm.jsx
import React, { useState, useRef, useEffect } from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Lock, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@context/AuthContext";
import api from "@api/api";
import { useNavigate } from "react-router-dom";

function parseServerError(err) {
  try {
    if (err && err.normalized && err.normalized.normalized) {
      const { general, fields } = err.normalized.normalized;
      return { general: general || "Request failed", fields: fields || {} };
    }
    if (err && err.error) return parseServerError(err.error);
    if (err && err.response && err.response.data) {
      const d = err.response.data;
      const fields = {};
      let general = d.error || d.message || null;
      if (d.errors && typeof d.errors === "object") {
        Object.entries(d.errors).forEach(([k, v]) => {
          fields[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
      }
      return { general, fields };
    }
    if (typeof err === "string") return { general: err, fields: {} };
    if (err && err.message) return { general: err.message, fields: {} };
  } catch {
    return { general: "Unknown error", fields: {} };
  }
  return { general: "Network error", fields: {} };
}

export const LoginForm = ({ onToggleMode = () => {} }) => {
  const auth = useAuth?.() ?? null;
  const { login } = auth ?? {};
  const remoteLoading = auth?.loading ?? false;

  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [notVerifiedEmail, setNotVerifiedEmail] = useState(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSet = (setter, value) => {
    if (!isMounted.current) return;
    setter(value);
  };

  const handleChange = (e) =>
    safeSet(setForm, (s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    safeSet(setErrors, {});
    safeSet(setSuccess, null);
    setNotVerifiedEmail(null);

    if (!form.identifier) {
      return safeSet(setErrors, { general: "Please enter your email." });
    }
    if (!form.password) {
      return safeSet(setErrors, { general: "Please enter your password." });
    }

    safeSet(setLoading, true);

    try {
      if (typeof login === "function") {
        const payload = { email: form.identifier, password: form.password };
        const res = await login(payload);

        if (!res?.ok) {
          const parsed = parseServerError(res.error || "Sign in failed");
          let msg = parsed.general;

          if (/not verified/i.test(msg)) {
            msg = "Please verify your email first. Check your inbox.";
            setNotVerifiedEmail(payload.email);
          }

          safeSet(setErrors, { general: msg, ...parsed.fields });
          return;
        }

        // ✅ login succeeded
        // If customer and missing KYC fields, send to customer details page
        if (res?.user?.role === "CUSTOMER") {
          const pan =
            res.user.pan_no ||
            res.user.pan ||
            (res.user.customer && res.user.customer.pan_no);
          if (!pan) {
            navigate("/profile/details");
            return;
          }
        }

        safeSet(setSuccess, "Signed in successfully — redirecting...");
        safeSet(setForm, (s) => ({ ...s, password: "" }));
      }
    } catch (err) {
      const parsed = parseServerError(err);
      safeSet(setErrors, { general: parsed.general, ...parsed.fields });
    } finally {
      safeSet(setLoading, false);
    }
  };

  const handleResendVerification = async () => {
    if (!notVerifiedEmail) return;
    try {
      await api.post("/api/auth/resend-verification", {
        email: notVerifiedEmail,
      });
      safeSet(
        setSuccess,
        "Verification email resent. Please check your inbox."
      );
      setNotVerifiedEmail(null);
    } catch (err) {
      const parsed = parseServerError(err);
      safeSet(setErrors, { general: parsed.general });
    }
  };

  const disabled = loading || remoteLoading;

  return (
    <MotionFadeIn>
      <Paper className="rounded-2xl p-6">
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-lime-50 text-lime-700 font-bold text-xl shadow-sm">
            PL
          </div>
          <h2 className="text-2xl font-extrabold mt-3">Welcome back</h2>
          <Text variant="muted" className="mt-1">
            Sign in to your account to manage loans, payments, and receipts.
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {errors.general && (
            <div className="p-2 rounded bg-red-50 text-red-700 text-sm border border-red-100">
              {errors.general}
            </div>
          )}
          {success && (
            <div className="p-2 rounded bg-green-50 text-emerald-700 text-sm border border-green-100">
              {success}
            </div>
          )}

          {notVerifiedEmail && (
            <div className="p-2 rounded bg-yellow-50 text-yellow-800 text-sm border border-yellow-100 flex items-center justify-between">
              <span>Email not verified. Please check your inbox.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendVerification}
                disabled={disabled}
                className="flex items-center gap-1 text-lime-700">
                <RefreshCw className="w-4 h-4" /> Resend
              </Button>
            </div>
          )}

          <Input
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            disabled={disabled}
            label="Email"
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.identifier || errors.email}
          />

          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            disabled={disabled}
            label="Password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            error={errors.password}
          />

          <Button
            type="submit"
            className="w-full"
            variant="gradient"
            disabled={disabled}
            style={{
              backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
              color: "white",
            }}>
            {loading || remoteLoading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="pt-2 text-center text-sm">
            <span className="text-base-content/70">
              Don’t have an account?{" "}
            </span>
            <button
              onClick={onToggleMode}
              className="text-lime-600 font-medium hover:underline"
              disabled={disabled}>
              Create account
            </button>
          </div>
        </form>
      </Paper>
    </MotionFadeIn>
  );
};

export default LoginForm;
