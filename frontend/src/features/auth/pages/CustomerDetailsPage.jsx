// src/features/profile/pages/CustomerDetailsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { useAuth } from "@context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * CustomerDetailsPage
 * - Vertical single-column KYC form with concise helper text under each input.
 * - Prefills customer data when available.
 * - Save -> updateCustomer (preferred) or registerCustomer fallback.
 * - Skip removed: the form is mandatory and user must complete it.
 */

export default function CustomerDetailsPage() {
  const {
    fetchCustomer,
    updateCustomer,
    registerCustomer,
    restoreSession,
    user,
  } = useAuth() ?? {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    pan: "",
    aadhaar: "",
    profession: "",
    years_experience: "",
    annual_income: "",
    address: "",
    bank_name: "",
    account_no: "",
    ifsc: "",
  });

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let customer = null;
        if (typeof fetchCustomer === "function") {
          const r = await fetchCustomer();
          if (r?.ok && r.customer) {
            customer = r.customer;
          }
        }
        if (!customer && user) {
          customer = user.customer || user;
        }
        if (customer) {
          setForm((s) => ({
            ...s,
            full_name: customer.full_name || customer.name || s.full_name,
            email: customer.email || user?.email || s.email,
            phone:
              customer.phone_number || customer.phone || user?.phone || s.phone,
            pan: customer.pan_no || customer.pan || s.pan,
            aadhaar: customer.aadhaar_no || s.aadhaar,
            profession: customer.profession || s.profession,
            years_experience:
              customer.years_experience ?? s.years_experience ?? "",
            annual_income: customer.annual_income ?? s.annual_income ?? "",
            address: customer.address || s.address,
            bank_name: customer.bank_name || s.bank_name,
            account_no:
              customer.account_number || customer.account_no || s.account_no,
            ifsc: customer.ifsc_code || customer.ifsc || s.ifsc,
          }));
        } else {
          setForm((s) => ({
            ...s,
            email: user?.email || s.email,
            full_name: user?.full_name || s.full_name,
          }));
        }
      } catch (e) {
        // ignore
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeSet = (setter, value) => {
    if (!isMounted.current) return;
    setter(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    safeSet(setForm, (s) => ({ ...s, [name]: value }));
    if (errors[name]) safeSet(setErrors, (o) => ({ ...o, [name]: "" }));
    if (success) safeSet(setSuccess, null);
  };

  const validate = () => {
    const errs = {};
    // presence checks for mandatory fields
    const required = [
      "full_name",
      "phone",
      "pan",
      "aadhaar",
      "profession",
      "years_experience",
      "annual_income",
      "address",
      "bank_name",
      "account_no",
      "ifsc",
    ];
    required.forEach((k) => {
      if (
        form[k] === undefined ||
        form[k] === null ||
        String(form[k]).trim() === ""
      ) {
        errs[k] = "This field is required";
      }
    });

    if (form.aadhaar && !/^\d{12}$/.test(form.aadhaar))
      errs.aadhaar = "Aadhaar must be 12 digits";
    if (form.pan && !/^[A-Z]{5}\d{4}[A-Z]$/i.test(form.pan))
      errs.pan = "PAN should be 10 chars (ABCDE1234F)";
    if (form.ifsc && form.ifsc.length < 6) errs.ifsc = "IFSC looks short";
    if (form.account_no && !/^[\d-]{6,24}$/.test(form.account_no))
      errs.account_no = "Account number looks invalid";
    if (
      form.years_experience &&
      (isNaN(Number(form.years_experience)) ||
        Number(form.years_experience) < 0)
    )
      errs.years_experience = "Invalid value";
    if (
      form.annual_income &&
      (isNaN(Number(form.annual_income)) || Number(form.annual_income) < 0)
    )
      errs.annual_income = "Invalid value";
    return errs;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    safeSet(setErrors, {});
    safeSet(setSuccess, null);

    const v = validate();
    if (Object.keys(v).length) return safeSet(setErrors, v);

    setSaving(true);

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      aadhaar_no: form.aadhaar || null,
      pan_no: form.pan || null,
      profession: form.profession || null,
      years_experience: form.years_experience
        ? Number(form.years_experience)
        : null,
      annual_income: form.annual_income ? Number(form.annual_income) : null,
      address: form.address || null,
      bank_name: form.bank_name || null,
      account_number: form.account_no || null,
      ifsc_code: form.ifsc || null,
    };

    try {
      let res;
      if (typeof updateCustomer === "function") {
        res = await updateCustomer(payload);
      } else if (typeof registerCustomer === "function") {
        res = await registerCustomer(payload);
      } else {
        throw new Error("No endpoint available to update customer");
      }

      if (!res?.ok) {
        const general = res?.error?.message || res?.error || "Save failed";
        safeSet(setErrors, { general });
        setSaving(false);
        return;
      }

      try {
        await restoreSession();
      } catch {
        // ignore
      }

      try {
        localStorage.removeItem("kyc_pending");
      } catch {}

      safeSet(
        setSuccess,
        "Customer details saved. Redirecting to dashboard..."
      );
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      safeSet(setErrors, { general: err?.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MotionFadeIn>
      <div className="max-w-xl mx-auto p-4">
        <Paper className="rounded-2xl p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold">
              Customer details &amp; KYC
            </h1>
            <Text variant="muted" className="mt-1">
              Provide the identity & bank details needed for faster approvals
              and disbursals. These fields are required to continue.
            </Text>
          </div>

          {errors.general && (
            <div className="p-3 rounded my-3 bg-red-50 text-red-700 text-sm border border-red-100">
              {errors.general}
            </div>
          )}
          {success && (
            <div className="p-3 rounded my-3 bg-green-50 text-emerald-700 text-sm border border-green-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Full name */}
            <div>
              <Input
                name="full_name"
                label="Full name"
                value={form.full_name}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Legal name as on Aadhaar/PAN.
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <Input
                name="email"
                label="Email"
                value={form.email}
                onChange={handleChange}
                disabled
              />
              <div className="text-xs text-slate-500 mt-1">
                Account email (verified) — cannot be changed here.
              </div>
            </div>

            {/* Phone */}
            <div>
              <Input
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Mobile for OTPs. Add country code if outside India.
              </div>
            </div>

            {/* Profession */}
            <div>
              <Input
                name="profession"
                label="Profession"
                value={form.profession}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                E.g. Salaried, Self-employed, Student.
              </div>
            </div>

            {/* PAN */}
            <div>
              <Input
                name="pan"
                label="PAN"
                placeholder="ABCDE1234F"
                value={form.pan}
                onChange={handleChange}
                error={errors.pan}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                10 chars (example: <code>ABCDE1234F</code>) — required for
                compliance.
              </div>
            </div>

            {/* Aadhaar */}
            <div>
              <Input
                name="aadhaar"
                label="Aadhaar"
                placeholder="123412341234"
                value={form.aadhaar}
                onChange={handleChange}
                error={errors.aadhaar}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                12 digits — numbers only.
              </div>
            </div>

            {/* Years experience */}
            <div>
              <Input
                name="years_experience"
                label="Years experience"
                value={form.years_experience}
                onChange={handleChange}
                error={errors.years_experience}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Total years in current/previous roles (numeric).
              </div>
            </div>

            {/* Annual income */}
            <div>
              <Input
                name="annual_income"
                label="Annual income (INR)"
                value={form.annual_income}
                onChange={handleChange}
                error={errors.annual_income}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Approx gross annual income (numeric).
              </div>
            </div>

            {/* Address */}
            <div>
              <Input
                name="address"
                label="Address"
                value={form.address}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Current residential address — include city & PIN.
              </div>
            </div>

            {/* Bank name */}
            <div>
              <Input
                name="bank_name"
                label="Bank name"
                value={form.bank_name}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Bank for disbursal.
              </div>
            </div>

            {/* Account number */}
            <div>
              <Input
                name="account_no"
                label="Account number"
                value={form.account_no}
                onChange={handleChange}
                error={errors.account_no}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                Full account number — used only for disbursal.
              </div>
            </div>

            {/* IFSC */}
            <div>
              <Input
                name="ifsc"
                label="IFSC"
                value={form.ifsc}
                onChange={handleChange}
                error={errors.ifsc}
                required
              />
              <div className="text-xs text-slate-500 mt-1">
                11-character IFSC (example: SBIN0000001).
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <div className="flex-1" />

              <Button
                type="submit"
                variant="gradient"
                disabled={saving}
                style={{
                  backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                  color: "white",
                }}>
                {saving ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </form>
        </Paper>
      </div>
    </MotionFadeIn>
  );
}
