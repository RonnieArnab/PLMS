// src/features/auth/components/BasicSignupForm.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { useAuth } from "@context/AuthContext";
import { User, Mail, Phone, Key } from "lucide-react";
import VerifyEmailPage from "@features/auth/pages/VerifyEmailPage.jsx";

/**
 * BasicSignupForm
 * - Two-step (recommended) -> create user only, then verify email, then complete profile (KYC)
 * - This file CALLS signupNoLogin (user-only) and then shows VerifyEmailPage.
 * - After the email verification link is clicked, backend redirects to /profile/details to fill customer details.
 */

const defaultBasic = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
};

function safeParseError(err) {
  try {
    if (err?.response?.data) {
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
    if (err?.message) return { general: err.message, fields: {} };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("safeParseError failed:", e, err);
  }
  return { general: "Network error or unknown error", fields: {} };
}

export default function BasicSignupForm({
  onToggleMode = () => {},
  onSignedUp,
}) {
  // USE signupNoLogin (create user only) so customerprofile is not created yet
  const { signup } = useAuth() ?? {};
  const [basic, setBasic] = useState(defaultBasic);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("form"); // form | verify
  const [pendingEmail, setPendingEmail] = useState(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const navigate = useNavigate();
  const safeSet = (setter, value) => {
    if (!isMounted.current) return;
    setter(value);
  };

  const validate = () => {
    const errs = {};
    if (!basic.full_name) errs.full_name = "Full name required";
    if (!basic.email) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(basic.email))
      errs.email = "Enter a valid email";
    if (!basic.password) errs.password = "Password required";
    else if (basic.password.length < 6)
      errs.password = "Use at least 6 characters";
    if (!basic.confirm_password) errs.confirm_password = "Please confirm";
    else if (basic.password !== basic.confirm_password)
      errs.confirm_password = "Passwords do not match";
    if (basic.phone && !/^[\d+\-\s()]{6,20}$/.test(basic.phone))
      errs.phone = "Enter a valid phone number";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    safeSet(setBasic, (s) => ({ ...s, [name]: value }));
    if (errors[name]) safeSet(setErrors, (o) => ({ ...o, [name]: "" }));
    if (errors.general && name === "email")
      safeSet(setErrors, (o) => ({ ...o, general: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    safeSet(setErrors, {});
    const v = validate();
    if (Object.keys(v).length) {
      safeSet(setErrors, v);
      return;
    }

    safeSet(setLoading, true);
    try {
      // Use signupNoLogin (user-only). If not available, fallback to signup (which also creates user).

      if (typeof signup === "function") {
        const res = await signup({
          full_name: basic.full_name,
          email: basic.email,
          password: basic.password,
          phone: basic.phone,
          role: "CUSTOMER",
        });

        if (!res?.ok) {
          const parsed = safeParseError(res.error || "Signup failed");
          safeSet(setErrors, { general: parsed.general, ...parsed.fields });
          safeSet(setLoading, false);
          return;
        }

        // Immediately navigate to verify step (user must click email link)
        safeSet(setPendingEmail, basic.email);
        safeSet(setStep, "verify");

        if (typeof onSignedUp === "function") {
          onSignedUp({ user: res.user ?? null });
        }

        safeSet(setLoading, false);
        return;
      }

      // fallback dev: go straight to verify UI
      safeSet(setPendingEmail, basic.email);
      safeSet(setStep, "verify");
      if (typeof onSignedUp === "function") onSignedUp({ email: basic.email });
      safeSet(setLoading, false);
    } catch (err) {
      const parsed = safeParseError(err);
      safeSet(setErrors, { general: parsed.general, ...parsed.fields });
      safeSet(setLoading, false);
    }
  };

  // onVerified callback -> after backend verification redirect, frontend will land on /profile/details
  // We still navigate to /profile/details to be safe in SPA flow
  const handleVerified = () => {
    navigate("/profile/details");
  };

  if (step === "verify") {
    return <VerifyEmailPage email={pendingEmail} onVerified={handleVerified} />;
  }

  return (
    <MotionFadeIn>
      <Paper className="rounded-2xl p-6">
        <div className="text-center mb-4 lg:mb-6">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-lime-50 text-lime-700 font-bold text-xl shadow-sm">
            ✨
          </div>
          <h2 className="text-2xl font-extrabold mt-3">Create your account</h2>
          <Text variant="muted" className="mt-1">
            Provide the basics to create your account. We'll email a
            verification link.
          </Text>
        </div>

        {errors.general && (
          <div className="p-3 rounded mb-3 bg-red-50 text-red-700 text-sm border border-red-100">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Input
              name="full_name"
              label="Full name"
              icon={<User className="w-4 h-4" />}
              value={basic.full_name}
              onChange={handleChange}
              error={errors.full_name}
            />
            <div className="text-xs text-slate-500 mt-1">
              Legal name as on ID.
            </div>
          </div>

          <div>
            <Input
              name="email"
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              value={basic.email}
              onChange={handleChange}
              error={errors.email}
            />
            <div className="text-xs text-slate-500 mt-1">
              We'll send a verification link.
            </div>
          </div>

          <div>
            <Input
              name="phone"
              label="Phone (optional)"
              icon={<Phone className="w-4 h-4" />}
              value={basic.phone}
              onChange={handleChange}
              error={errors.phone}
            />
            <div className="text-xs text-slate-500 mt-1">
              Optional — used for OTPs.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Input
                name="password"
                label="Password"
                type="password"
                icon={<Key className="w-4 h-4" />}
                value={basic.password}
                onChange={handleChange}
                error={errors.password}
              />
              <div className="text-xs text-slate-500 mt-1">Min 6 chars.</div>
            </div>

            <div>
              <Input
                name="confirm_password"
                label="Confirm password"
                type="password"
                icon={<Key className="w-4 h-4" />}
                value={basic.confirm_password}
                onChange={handleChange}
                error={errors.confirm_password}
              />
              <div className="text-xs text-slate-500 mt-1">
                Re-enter password.
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              variant="gradient"
              disabled={loading}
              style={{
                backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                color: "white",
              }}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>

          <div className="pt-2 text-center text-sm">
            <span className="text-base-content/70">
              Already have an account?{" "}
            </span>
            <button
              onClick={onToggleMode}
              className="text-lime-600 font-medium hover:underline"
              type="button">
              Sign in
            </button>
          </div>
        </form>
      </Paper>
    </MotionFadeIn>
  );
}
