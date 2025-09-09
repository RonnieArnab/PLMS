// src/features/auth/components/LoginForm.jsx
import React, { useState, useRef, useEffect } from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@context/AuthContext";

/**
 * Safe LoginForm
 * - defensive error parsing
 * - avoids setting state after unmount
 * - requires email (because backend login queries by email)
 */

function parseServerError(err) {
  try {
    // 1) axios normalized error (our api.js attaches err.normalized)
    if (err && err.normalized && err.normalized.normalized) {
      const { general, fields } = err.normalized.normalized;
      return { general: general || "Request failed", fields: fields || {} };
    }

    // 2) AuthContext wrapper might return { ok: false, error: ... }
    if (err && err.error) {
      return parseServerError(err.error);
    }

    // 3) axios style error with response.data
    if (err && err.response && err.response.data) {
      const d = err.response.data;
      const fields = {};
      let general = d.error || d.message || null;

      if (d.errors && typeof d.errors === "object") {
        // errors may be { field: "msg" } or { field: ["msg"] } or [{field, message}]
        if (Array.isArray(d.errors)) {
          d.errors.forEach((item) => {
            if (typeof item === "string")
              general = general ? `${general}; ${item}` : item;
            else if (item.field && item.message)
              fields[item.field] = item.message;
          });
        } else {
          Object.entries(d.errors).forEach(([k, v]) => {
            fields[k] = Array.isArray(v) ? v.join(" ") : String(v);
          });
        }
      }

      // top-level field keys: e.g. { email: "invalid" }
      Object.keys(d).forEach((k) => {
        if (["error", "message", "errors"].includes(k)) return;
        const v = d[k];
        if (Array.isArray(v) && v.length) fields[k] = v.join(" ");
        else if (typeof v === "string") fields[k] = v;
      });

      if (!general && Object.keys(fields).length === 0) {
        general = `Request failed (${err.response.status || "?"})`;
      }
      return { general, fields };
    }

    // 4) plain Error or string
    if (typeof err === "string") return { general: err, fields: {} };
    if (err && err.message) return { general: err.message, fields: {} };
  } catch (parseErr) {
    // eslint-disable-next-line no-console
    console.error("parseServerError failed", parseErr, err);
  }
  return { general: "Network error or unknown error", fields: {} };
}

export const LoginForm = ({ onToggleMode = () => {} }) => {
  const auth = useAuth?.() ?? null;
  const { login } = auth ?? {};
  const remoteLoading = auth?.loading ?? false;

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // { general, identifier, password }
  const [success, setSuccess] = useState(null);

  // avoid setState on unmounted component
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

  const simulateNetwork = (ms = 900) =>
    new Promise((res) => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    safeSet(setErrors, {});
    safeSet(setSuccess, null);

    // basic validation
    if (!form.identifier) {
      safeSet(setErrors, { general: "Please enter your email." });
      return;
    }
    if (!form.password) {
      safeSet(setErrors, { general: "Please enter your password." });
      return;
    }

    // backend currently authenticates by email, ensure identifier is email
    const isEmail = /\S+@\S+\.\S+/.test(form.identifier);
    if (!isEmail) {
      safeSet(setErrors, {
        general:
          "Please sign in using your email address (we currently require email).",
      });
      return;
    }

    safeSet(setLoading, true);

    try {
      if (typeof login === "function") {
        // login expects { email, password } on server
        const payload = { email: form.identifier, password: form.password };
        const res = await login(payload);
        if (!res?.ok) {
          // AuthContext returned { ok:false, error: ... }
          const parsed = parseServerError(res.error || "Sign in failed");
          safeSet(setErrors, { general: parsed.general, ...parsed.fields });
          safeSet(setLoading, false);
          return;
        }
      } else {
        // no backend - simulate success
        await simulateNetwork();
      }

      safeSet(setSuccess, "Signed in successfully — redirecting...");
      // clear password for security
      safeSet(setForm, (s) => ({ ...s, password: "" }));

      // Redirect will be handled by app on auth.user change. If you want immediate client redirect here,
      // inject navigation (e.g. useNavigate) and call navigate("/")
    } catch (err) {
      // parse error from API module (axios normalized)
      const parsed = parseServerError(err);
      safeSet(setErrors, { general: parsed.general, ...parsed.fields });
    } finally {
      safeSet(setLoading, false);
    }
  };

  const disabled = loading || remoteLoading;

  return (
    <MotionFadeIn>
      <Paper className="rounded-2xl p-6">
        <div className="">
          {/* left: form */}
          <div>
            <div className="text-center mb-4 lg:mb-6">
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    disabled={disabled}
                  />
                  <span className="text-sm">Remember me</span>
                </label>

                <button
                  type="button"
                  className="text-sm text-lime-600 hover:underline"
                  onClick={() => console.log("forgot password")}
                  disabled={disabled}>
                  Forgot password?
                </button>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="gradient"
                  disabled={disabled}
                  style={{
                    backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                    color: "white",
                  }}>
                  {loading || remoteLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>

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
          </div>
        </div>
      </Paper>
    </MotionFadeIn>
  );
};

export default LoginForm;
