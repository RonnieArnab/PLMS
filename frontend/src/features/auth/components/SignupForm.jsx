// src/features/auth/components/SignupForm.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { useAuth } from "@context/AuthContext";
import { User, Mail, Phone, Key } from "lucide-react";
import api from "@api/api";
import Cookies from "js-cookie";

/**
 * SignupForm.jsx
 * - two-step signup (basic -> details)
 * - "Skip for now" on step 2 uses restoreSession + navigate('/dashboard')
 * - sets localStorage.kyc_pending = "true" when user skips (dashboard can remind)
 * - robust error handling and safe setState after unmount
 *
 * NOTE: the optional backend remind endpoint call is commented out (temp).
 */

const defaultBasic = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
};

const defaultDetails = {
  pan: "",
  aadhaar: "",
  profession: "",
  years_experience: "",
  annual_income: "",
  address: "",
  bank_name: "",
  account_no: "",
  ifsc: "",
};

function safeParseError(err) {
  try {
    if (err && err.normalized && err.normalized.normalized) {
      const { general, fields } = err.normalized.normalized;
      return { general: general || "Request failed", fields: fields || {} };
    }
    if (err && err.error && typeof err.error === "object")
      return safeParseError(err.error);
    if (err && err.response && err.response.data) {
      const d = err.response.data;
      const fields = {};
      let general = d.error || d.message || null;

      if (d.errors && typeof d.errors === "object") {
        if (Array.isArray(d.errors)) {
          d.errors.forEach((it) => {
            if (typeof it === "string")
              general = general ? `${general}; ${it}` : it;
            else if (it.field && it.message) fields[it.field] = it.message;
          });
        } else {
          Object.entries(d.errors).forEach(([k, v]) => {
            fields[k] = Array.isArray(v) ? v.join(" ") : String(v);
          });
        }
      }

      Object.keys(d).forEach((k) => {
        if (["error", "message", "errors"].includes(k)) return;
        const v = d[k];
        if (Array.isArray(v) && v.length) fields[k] = v.join(" ");
        else if (typeof v === "string") fields[k] = v;
      });

      if (!general && Object.keys(fields).length === 0)
        general = `Request failed (${err.response.status || "?"})`;
      return { general, fields };
    }
    if (typeof err === "string") return { general: err, fields: {} };
    if (err && err.message) return { general: err.message, fields: {} };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("safeParseError failed:", e, err);
  }
  return { general: "Network error or unknown error", fields: {} };
}

export default function SignupForm({ onToggleMode = () => {} }) {
  const auth = useAuth?.() ?? null;
  const { signup, signupNoLogin, registerCustomer, restoreSession } =
    auth ?? {};
  const remoteLoading = auth?.authLoading ?? false;

  const [step, setStep] = useState(1);
  const [basic, setBasic] = useState(defaultBasic);
  const [details, setDetails] = useState(defaultDetails);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [skippedReminderShown, setSkippedReminderShown] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    // show reminder if user previously skipped
    if (localStorage.getItem("kyc_pending") === "true") {
      setSkippedReminderShown(true);
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  const navigate = useNavigate();

  const safeSet = (setter, value) => {
    if (!isMounted.current) return;
    setter(value);
  };

  const validateBasic = () => {
    const errs = {};
    if (!basic.full_name) errs.full_name = "Full name required";
    if (!basic.email) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(basic.email))
      errs.email = "Enter a valid email";
    if (!basic.password) errs.password = "Password required";
    if (basic.password && basic.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (!basic.confirm_password)
      errs.confirm_password = "Please confirm password";
    if (
      basic.password &&
      basic.confirm_password &&
      basic.password !== basic.confirm_password
    )
      errs.confirm_password = "Passwords do not match";
    if (basic.phone && !/^[\d+\-\s()]{6,20}$/.test(basic.phone))
      errs.phone = "Enter a valid phone number";
    return errs;
  };

  const validateDetails = () => {
    const errs = {};
    if (details.years_experience && Number(details.years_experience) < 0)
      errs.years_experience = "Invalid value";
    if (details.annual_income && Number(details.annual_income) < 0)
      errs.annual_income = "Invalid value";
    return errs;
  };

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasic((s) => ({ ...s, [name]: value }));
    if (errors[name] || errors.general)
      safeSet(setErrors, (o) => ({ ...o, [name]: "", general: "" }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setDetails((s) => ({ ...s, [name]: value }));
    if (errors[name] || errors.general)
      safeSet(setErrors, (o) => ({ ...o, [name]: "", general: "" }));
  };

  // STEP 1: create user row but do not auto-login (preferred path: signupNoLogin)
  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    if (!isMounted.current) return;
    safeSet(setErrors, {});
    safeSet(setSuccess, null);

    const v = validateBasic();
    if (Object.keys(v).length) {
      safeSet(setErrors, v);
      return;
    }

    safeSet(setLoading, true);
    try {
      if (typeof signupNoLogin === "function") {
        const res = await signupNoLogin({
          email: basic.email,
          password: basic.password,
          phone: basic.phone,
          role: "CUSTOMER",
          full_name: basic.full_name,
        });
        if (!res?.ok) {
          const parsed = safeParseError(res.error || "Signup failed");
          safeSet(setErrors, { general: parsed.general, ...parsed.fields });
          safeSet(setLoading, false);
          return;
        }
        safeSet(setStep, 2);
        safeSet(
          setSuccess,
          "Account created. Please complete KYC & bank details."
        );
      } else if (typeof signup === "function") {
        // fallback: call sign up endpoint (may auto-login)
        const resp = await api.post("/api/auth/signup", {
          email: basic.email,
          password: basic.password,
          phone: basic.phone,
          role: "CUSTOMER",
        });
        const accessToken = resp?.data?.accessToken;
        if (accessToken)
          Cookies.set("accessToken", accessToken, { sameSite: "strict" });
        safeSet(setStep, 2);
        safeSet(
          setSuccess,
          "Account created. Please complete KYC & bank details."
        );
      } else {
        // dev fallback: no backend
        safeSet(setStep, 2);
        safeSet(
          setSuccess,
          "Account created (dev). Please complete KYC & bank details."
        );
      }
    } catch (err) {
      const parsed = safeParseError(err);
      safeSet(setErrors, { general: parsed.general, ...parsed.fields });
    } finally {
      safeSet(setLoading, false);
    }
  };

  // STEP 2: complete profile
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!isMounted.current) return;
    safeSet(setErrors, {});
    safeSet(setSuccess, null);

    const v = validateDetails();
    if (Object.keys(v).length) {
      safeSet(setErrors, v);
      return;
    }

    safeSet(setLoading, true);
    try {
      const payload = {
        full_name: basic.full_name,
        email: basic.email,
        password: basic.password,
        phone: basic.phone,
        aadhaar_no: details.aadhaar || null,
        pan_no: details.pan || null,
        profession: details.profession || null,
        years_experience: details.years_experience
          ? Number(details.years_experience)
          : null,
        annual_income: details.annual_income
          ? Number(details.annual_income)
          : null,
        address: details.address || null,
        bank_name: details.bank_name || null,
        account_number: details.account_no || null,
        ifsc_code: details.ifsc || null,
        account_type: details.account_type || null,
      };

      if (typeof registerCustomer === "function") {
        const res = await registerCustomer({
          ...payload,
          aadhaar: payload.aadhaar_no,
          pan: payload.pan_no,
        });
        if (!res?.ok) {
          const parsed = safeParseError(
            res.error || "Customer registration failed"
          );
          safeSet(setErrors, { general: parsed.general, ...parsed.fields });
          safeSet(setLoading, false);
          return;
        }
        safeSet(
          setSuccess,
          "Customer registered successfully. Finalizing login..."
        );
      } else {
        // protected endpoint: uses cookie accessToken from step1 (if present)
        await api.post("/api/customer/complete", payload);
        safeSet(setSuccess, "Profile saved successfully. Finalizing login...");
      }

      // finalize session
      if (typeof restoreSession === "function") {
        try {
          await restoreSession();
        } catch (rsErr) {
          const parsed = safeParseError(rsErr);
          safeSet(setErrors, {
            general:
              parsed.general || "Registered but could not finalize session",
            ...parsed.fields,
          });
          safeSet(setLoading, false);
          return;
        }
      }

      // navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      const parsed = safeParseError(err);
      safeSet(setErrors, { general: parsed.general, ...parsed.fields });
    } finally {
      safeSet(setLoading, false);
    }
  };

  // SKIP: allow user to skip completing details, finalize session and navigate
  const handleSkip = async () => {
    if (!isMounted.current) return;
    safeSet(setErrors, {});
    safeSet(setSuccess, null);
    safeSet(setLoading, true);

    try {
      // finalize session (refresh token endpoint) so user is logged in
      if (typeof restoreSession === "function") {
        try {
          await restoreSession();
        } catch (rsErr) {
          const parsed = safeParseError(rsErr);
          safeSet(setErrors, {
            general:
              parsed.general ||
              "Could not finalize session. Please try logging in.",
            ...parsed.fields,
          });
          safeSet(setLoading, false);
          return;
        }
      }

      // set flag so dashboard can remind the user
      try {
        localStorage.setItem("kyc_pending", "true");
        setSkippedReminderShown(true);
      } catch {
        // ignore localStorage errors
      }

      // BEST-EFFORT: commented temporary reminder API call (no endpoint yet)
      // try {
      //   // temp: notify backend to create a reminder (optional)
      //   // await api.post("/api/notifications/remind-kyc", { message: "User skipped KYC" });
      // } catch (ignore) {}

      safeSet(
        setSuccess,
        "You're in! Please complete your profile later from the dashboard."
      );
      navigate("/dashboard");
    } catch (err) {
      const parsed = safeParseError(err);
      safeSet(setErrors, { general: parsed.general, ...parsed.fields });
    } finally {
      safeSet(setLoading, false);
    }
  };

  const disabled = loading || remoteLoading;

  return (
    <MotionFadeIn>
      <Paper className="rounded-2xl p-6">
        <div>
          <div className="text-center mb-4 lg:mb-6">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-lime-50 text-lime-700 font-bold text-xl shadow-sm">
              ✨
            </div>
            <h2 className="text-2xl font-extrabold mt-3">
              Create your account
            </h2>
            <Text variant="muted" className="mt-1">
              We’ll ask for a few KYC & bank details so you can apply faster.
            </Text>
          </div>

          {errors.general && (
            <div className="p-3 rounded mb-3 bg-red-50 text-red-700 text-sm border border-red-100">
              {errors.general}
            </div>
          )}
          {success && (
            <div className="p-3 rounded mb-3 bg-green-50 text-emerald-700 text-sm border border-green-100">
              {success}
            </div>
          )}

          {skippedReminderShown && (
            <div className="p-2 rounded mb-3 bg-yellow-50 text-yellow-800 text-sm border border-yellow-100">
              You previously skipped completing your profile. Please complete
              KYC later under{" "}
              <a className="underline text-lime-700" href="/dashboard">
                Dashboard → Profile
              </a>
              .
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleBasicSubmit} className="space-y-3" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  name="full_name"
                  label="Full name"
                  icon={<User className="w-4 h-4" />}
                  value={basic.full_name}
                  onChange={handleBasicChange}
                  disabled={disabled}
                  error={errors.full_name}
                />
                <Input
                  name="email"
                  label="Email"
                  icon={<Mail className="w-4 h-4" />}
                  value={basic.email}
                  onChange={handleBasicChange}
                  disabled={disabled}
                  error={errors.email}
                />
                <Input
                  name="phone"
                  label="Phone"
                  icon={<Phone className="w-4 h-4" />}
                  value={basic.phone}
                  onChange={handleBasicChange}
                  disabled={disabled}
                  error={errors.phone}
                />
                <Input
                  name="password"
                  label="Password"
                  type="password"
                  icon={<Key className="w-4 h-4" />}
                  value={basic.password}
                  onChange={handleBasicChange}
                  disabled={disabled}
                  error={errors.password}
                />
                <Input
                  name="confirm_password"
                  label="Confirm password"
                  type="password"
                  icon={<Key className="w-4 h-4" />}
                  value={basic.confirm_password}
                  onChange={handleBasicChange}
                  disabled={disabled}
                  error={errors.confirm_password}
                />
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
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>

              <div className="pt-2 text-center text-sm">
                <span className="text-base-content/70">
                  Already have an account?{" "}
                </span>
                <button
                  onClick={onToggleMode}
                  className="text-lime-600 font-medium hover:underline"
                  disabled={disabled}>
                  Sign in
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handleDetailsSubmit}
              className="space-y-3"
              noValidate>
              <div className="text-sm text-slate-600">
                A few more details to complete your profile (optional fields can
                be skipped).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  name="pan"
                  label="PAN"
                  value={details.pan}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.pan || errors.pan_no}
                />
                <Input
                  name="aadhaar"
                  label="Aadhaar"
                  value={details.aadhaar}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.aadhaar || errors.aadhaar_no}
                />
                <Input
                  name="profession"
                  label="Profession"
                  value={details.profession}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.profession}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  name="years_experience"
                  label="Years experience"
                  value={details.years_experience}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.years_experience}
                />
                <Input
                  name="annual_income"
                  label="Annual income"
                  value={details.annual_income}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.annual_income}
                />
                <Input
                  name="address"
                  label="Address"
                  value={details.address}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.address}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  name="bank_name"
                  label="Bank name"
                  value={details.bank_name}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.bank_name}
                />
                <Input
                  name="account_no"
                  label="Account number"
                  value={details.account_no}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.account_number || errors.account_no}
                />
                <Input
                  name="ifsc"
                  label="IFSC"
                  value={details.ifsc}
                  onChange={handleDetailsChange}
                  disabled={disabled}
                  error={errors.ifsc || errors.ifsc_code}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={disabled}>
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={disabled}
                  title="Skip for now">
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  variant="gradient"
                  disabled={disabled}
                  style={{
                    backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                    color: "white",
                  }}>
                  {loading ? (
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
                      Saving...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Paper>
    </MotionFadeIn>
  );
}
