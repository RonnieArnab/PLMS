// src/pages/KycUpdatePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { AlertCircle, FileText, Check } from "lucide-react";
import api from "@api/api";
import useCustomer from "@features/profile/hooks/useCustomer";

const MAX_FILE_MB = 5;
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "image/jpg",
];

/* KycCardSkeleton: small skeleton used while loading customer */
function KycCardSkeleton({ title }) {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="h-3 w-40 bg-base-200 rounded mt-1" />
        </div>
        <div className="h-5 w-16 bg-base-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="md:col-span-2">
          <div className="h-10 w-full bg-base-200 rounded" />
        </div>
        <div>
          <div className="h-10 w-full bg-base-200 rounded" />
        </div>
      </div>
    </Card>
  );
}

export default function KycUpdatePage() {
  const {
    customer,
    loading: custLoading,
    error: custError,
    refreshCustomer,
  } = useCustomer();
  const navigate = useNavigate();
  const mounted = useRef(true);

  // form fields
  const [panNo, setPanNo] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false); // submit
  const [result, setResult] = useState(null); // { ok, message }
  const [errors, setErrors] = useState({});

  // initialize local fields from customer when it becomes available
  useEffect(() => {
    mounted.current = true;
    if (customer) {
      setPanNo(customer.pan_no || customer.pan || "");
      setAadhaarNo(customer.aadhaar_no || customer.aadhaar || "");
    }
    return () => {
      mounted.current = false;
      if (panPreview) URL.revokeObjectURL(panPreview);
      if (aadhaarPreview) URL.revokeObjectURL(aadhaarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  // previews for selected files
  useEffect(() => {
    if (panFile) {
      const url = URL.createObjectURL(panFile);
      setPanPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPanPreview(null);
    }
  }, [panFile]);

  useEffect(() => {
    if (aadhaarFile) {
      const url = URL.createObjectURL(aadhaarFile);
      setAadhaarPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAadhaarPreview(null);
    }
  }, [aadhaarFile]);

  const validate = () => {
    const e = {};
    if (panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNo))
      e.pan_no = "PAN looks invalid (ABCDE1234F)";
    if (panFile) {
      if (!ACCEPTED_FILE_TYPES.includes(panFile.type))
        e.pan_file = "PAN file must be PNG/JPG/PDF";
      if (panFile.size / 1024 / 1024 > MAX_FILE_MB)
        e.pan_file = `PAN file must be <= ${MAX_FILE_MB}MB`;
    }
    if (aadhaarNo && !/^\d{12}$/.test(aadhaarNo))
      e.aadhaar_no = "Aadhaar must be 12 digits";
    if (aadhaarFile) {
      if (!ACCEPTED_FILE_TYPES.includes(aadhaarFile.type))
        e.aadhaar_file = "Aadhaar file must be PNG/JPG/PDF";
      if (aadhaarFile.size / 1024 / 1024 > MAX_FILE_MB)
        e.aadhaar_file = `Aadhaar file must be <= ${MAX_FILE_MB}MB`;
    }
    if (!panNo && !aadhaarNo && !panFile && !aadhaarFile)
      e.general = "Provide at least PAN or Aadhaar (number or document)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onFilePick = (e, setter) => setter(e.target.files?.[0] || null);

  const submitKyc = async (ev) => {
    ev?.preventDefault?.();
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    setErrors((s) => ({ ...s, general: null }));

    try {
      const form = new FormData();
      if (panNo) form.append("pan_no", panNo);
      if (panFile) form.append("pan_file", panFile);
      if (aadhaarNo) form.append("aadhaar_no", aadhaarNo);
      if (aadhaarFile) form.append("aadhaar_file", aadhaarFile);

      // try real endpoint
      const resp = await api.post("/api/customer/kyc", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!mounted.current) return;

      setResult({
        ok: true,
        message:
          resp?.data?.message || "KYC submitted. We will verify shortly.",
      });
      setErrors({});

      // refresh customer data (preferred) so frontend reflects updated fields/kyc_status
      if (typeof refreshCustomer === "function") {
        try {
          await refreshCustomer();
        } catch (refreshErr) {
          // ignore — we already succeeded submission; optionally log
          // eslint-disable-next-line no-console
          console.warn("refreshCustomer after KYC failed:", refreshErr);
        }
      }
    } catch (err) {
      const status = err?.response?.status;
      // dev fallback: if endpoint missing, simulate success so dev flow continues
      if (
        status === 404 ||
        status === 501 ||
        /Network Error/i.test(err?.message || "")
      ) {
        if (mounted.current) {
          setResult({
            ok: true,
            message: "(DEV) KYC simulated — endpoint missing.",
          });
          setErrors({});
          if (typeof refreshCustomer === "function") {
            try {
              await refreshCustomer();
            } catch (_) {}
          }
        }
      } else if (err?.response?.data) {
        const payload = err.response.data;
        if (payload.errors && typeof payload.errors === "object") {
          setErrors((s) => ({ ...s, ...payload.errors }));
          setResult({ ok: false, message: payload.error || "KYC failed" });
        } else if (payload.error || payload.message) {
          setResult({ ok: false, message: payload.error || payload.message });
        } else {
          setResult({ ok: false, message: "KYC failed (server error)" });
        }
      } else {
        setResult({ ok: false, message: err?.message || "Network error" });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const cancel = () => navigate("/profile");

  const showPreviewBadge = useMemo(
    () => (ok) =>
      ok ? (
        <Badge variant="success" size="sm">
          <Check className="w-4 h-4" /> Uploaded
        </Badge>
      ) : (
        <Badge variant="secondary" size="sm">
          <FileText className="w-4 h-4" /> No file
        </Badge>
      ),
    []
  );

  // derive kyc status to display (fallback to customer.kyc_status)
  const kycStatusLabel = (customer && customer.kyc_status) || "NOT_SUBMITTED";
  const kycBadge = (() => {
    const s = String(kycStatusLabel).toUpperCase();
    if (s === "VERIFIED" || s === "APPROVED") {
      return <Badge variant="success">Verified</Badge>;
    }
    if (s === "PENDING") {
      return <Badge variant="warning">Pending</Badge>;
    }
    if (s === "REJECTED") {
      return <Badge variant="danger">Rejected</Badge>;
    }
    return <Badge variant="secondary">Not submitted</Badge>;
  })();

  return (
    <MotionFadeIn>
      <div className="max-w-4xl mx-auto p-6">
        <Paper className="rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Update KYC Documents</h1>
              <Text variant="muted" className="mt-1">
                Upload your PAN & Aadhaar documents and/or add the numbers.
                We’ll verify and update your profile status.
              </Text>
            </div>
            <div>{kycBadge}</div>
          </div>

          {/* show skeleton while customer loads */}
          {custLoading ? (
            <div className="space-y-6">
              <KycCardSkeleton title="PAN" />
              <KycCardSkeleton title="Aadhaar" />
            </div>
          ) : (
            <form onSubmit={submitKyc} className="space-y-6" noValidate>
              {errors.general && (
                <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-100">
                  <AlertCircle className="inline-block mr-2 w-4 h-4 align-middle" />
                  {errors.general}
                </div>
              )}

              {/* PAN */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium">PAN</h3>
                    <Text variant="muted" className="text-sm">
                      Upload PAN card (image/pdf) and enter PAN number
                      (optional).
                    </Text>
                  </div>
                  <div>{showPreviewBadge(!!panFile)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      name="pan_no"
                      label="PAN number"
                      value={panNo}
                      onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      error={errors.pan_no || errors.panNo}
                    />
                    {/* also show the currently saved PAN (readonly) if available */}
                    {customer?.pan_no && !panNo && (
                      <div className="text-sm text-base-content/60 mt-1">
                        Saved PAN:{" "}
                        <span className="font-medium">{customer.pan_no}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-base-content/70">
                      PAN file
                    </label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => onFilePick(e, setPanFile)}
                      className="file-input file-input-bordered w-full"
                      disabled={loading}
                    />
                    {errors.pan_file && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.pan_file}
                      </div>
                    )}
                    {panPreview && (
                      <div className="mt-2">
                        <a
                          href={panPreview}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline text-lime-600">
                          Preview PAN file
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Aadhaar */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium">Aadhaar</h3>
                    <Text variant="muted" className="text-sm">
                      Upload Aadhaar (image/pdf) and enter Aadhaar number
                      (optional).
                    </Text>
                  </div>
                  <div>{showPreviewBadge(!!aadhaarFile)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      name="aadhaar_no"
                      label="Aadhaar number"
                      value={aadhaarNo}
                      onChange={(e) =>
                        setAadhaarNo(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="123412341234"
                      error={errors.aadhaar_no || errors.aadhaarNo}
                    />
                    {customer?.aadhaar_no && !aadhaarNo && (
                      <div className="text-sm text-base-content/60 mt-1">
                        Saved Aadhaar:{" "}
                        <span className="font-medium">
                          {customer.aadhaar_no}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-base-content/70">
                      Aadhaar file
                    </label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => onFilePick(e, setAadhaarFile)}
                      className="file-input file-input-bordered w-full"
                      disabled={loading}
                    />
                    {errors.aadhaar_file && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.aadhaar_file}
                      </div>
                    )}
                    {aadhaarPreview && (
                      <div className="mt-2">
                        <a
                          href={aadhaarPreview}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline text-lime-600">
                          Preview Aadhaar file
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="flex items-center gap-3 justify-end">
                <Button variant="outline" onClick={cancel} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={loading}
                  style={{
                    backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                    color: "white",
                  }}>
                  {loading ? "Submitting..." : "Save & Submit for Verification"}
                </Button>
              </div>

              {result && (
                <div
                  className={`p-3 rounded ${
                    result.ok
                      ? "bg-green-50 text-emerald-700 border border-green-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                  {result.ok ? (
                    <Check className="inline-block mr-2 w-4 h-4 align-middle" />
                  ) : (
                    <AlertCircle className="inline-block mr-2 w-4 h-4 align-middle" />
                  )}
                  <span className="align-middle">{result.message}</span>
                </div>
              )}
            </form>
          )}
        </Paper>
      </div>
    </MotionFadeIn>
  );
}
