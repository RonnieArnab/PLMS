// src/pages/KycUpdatePage.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { AlertCircle, Check, ArrowLeft } from "lucide-react";
import api from "@api/api";
import { API_ROUTES } from "@config/apiRoutes";
import useCustomer from "@features/profile/hooks/useCustomer";
import useKYC from "@features/profile/hooks/useKyc";
import KycTypeCard from "@features/profile/components/KycTypeCard";

const MAX_FILE_MB = 5;
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "image/jpg",
  "application/zip",
];

function KycSkeleton({ title }) {
  return (
    <div className="p-4 rounded shadow-sm animate-pulse">
      <div className="h-5 w-48 bg-base-200 rounded mb-2" />
      <div className="h-3 w-full bg-base-200 rounded" />
    </div>
  );
}

export default function KycUpdatePage() {
  const { customer, loading: custLoading, refreshCustomer } = useCustomer();
  const { kyc, loading: kycLoading, refresh: refreshKyc } = useKYC();
  const navigate = useNavigate();
  const mounted = useRef(true);

  // controlled fields for both types
  const [fields, setFields] = useState({
    pan_no: "",
    pan_pdf_pass: "",
    aadhaar_no: "",
    aadhaar_pdf_pass: "",
    aadhaar_zip_pass: "",
  });

  const [files, setFiles] = useState({ pan: null, aadhaar: null });
  const [loadingAadhaar, setLoadingAadhaar] = useState(false);
  const [loadingPan, setLoadingPan] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastResponses, setLastResponses] = useState({
    PAN: null,
    AADHAAR: null,
  });
  const [globalResult, setGlobalResult] = useState(null);

  // prefill from customer or kyc records when mounted or when customer changes
  useEffect(() => {
    mounted.current = true;
    // prefill pan_no and aadhaar_no with priority: local fields -> kyc parsed -> customer
    setFields((prev) => ({
      ...prev,
      pan_no:
        prev.pan_no ||
        (kyc.PAN?.parsed?.pan ? kyc.PAN.parsed.pan : "") ||
        (customer?.pan_no ?? ""),
      aadhaar_no:
        prev.aadhaar_no ||
        (kyc.AADHAAR?.parsed?.aadhaar_last4
          ? `**** **** ${kyc.AADHAAR.parsed.aadhaar_last4}`
          : "") ||
        (customer?.aadhaar_no ?? ""),
    }));
    // set lastResponses to what we already have
    setLastResponses({ PAN: kyc.PAN, AADHAAR: kyc.AADHAAR });
    return () => {
      mounted.current = false;
    };
  }, [customer, kyc]);

  // safe field set
  const onChangeField = (name, value) => {
    if (name === "clear") {
      // special: clear local files & passcodes or specific type clearing
      setFiles({ pan: null, aadhaar: null });
      setFields({
        pan_no: "",
        pan_pdf_pass: "",
        aadhaar_no: "",
        aadhaar_pdf_pass: "",
        aadhaar_zip_pass: "",
      });
      setErrors({});
      setGlobalResult(null);
      return;
    }
    setFields((s) => ({ ...s, [name]: value }));
  };

  const onSelectFile = (which, file) =>
    setFiles((s) => ({ ...s, [which]: file }));

  // validation helpers
  const validateAadhaar = useCallback(() => {
    const e = {};
    const aadNo = String(fields.aadhaar_no || "").replace(/\D/g, "");
    if (fields.aadhaar_no && !/^\d{12}$/.test(aadNo)) {
      e.aadhaar_no = "Aadhaar must be 12 digits";
    }
    const f = files.aadhaar;
    if (f) {
      if (!ACCEPTED_FILE_TYPES.includes(f.type))
        e.aadhaar_file = "Aadhaar file must be PNG/JPG/PDF/ZIP";
      if (f.size / 1024 / 1024 > MAX_FILE_MB)
        e.aadhaar_file = `Aadhaar file must be <= ${MAX_FILE_MB}MB`;
    }
    setErrors((s) => ({ ...s, ...e }));
    return Object.keys(e).length === 0;
  }, [fields.aadhaar_no, files.aadhaar]);

  const validatePan = useCallback(() => {
    const e = {};
    const panNo = String(fields.pan_no || "");
    if (fields.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNo)) {
      e.pan_no = "PAN looks invalid (ABCDE1234F)";
    }
    const f = files.pan;
    if (f) {
      if (!ACCEPTED_FILE_TYPES.includes(f.type))
        e.pan_file = "PAN file must be PNG/JPG/PDF";
      if (f.size / 1024 / 1024 > MAX_FILE_MB)
        e.pan_file = `PAN file must be <= ${MAX_FILE_MB}MB`;
    }
    setErrors((s) => ({ ...s, ...e }));
    return Object.keys(e).length === 0;
  }, [fields.pan_no, files.pan]);

  // Submit Aadhaar
  const submitAadhaar = async () => {
    setGlobalResult(null);
    if (!validateAadhaar()) return;
    setLoadingAadhaar(true);
    try {
      const form = new FormData();
      if (fields.aadhaar_no)
        form.append("aadhaar_no", String(fields.aadhaar_no).replace(/\D/g, ""));
      if (files.aadhaar) form.append("aadhaar_file", files.aadhaar);
      if (fields.aadhaar_pdf_pass)
        form.append("aadhaar_pdf_passcode", fields.aadhaar_pdf_pass);
      if (fields.aadhaar_zip_pass)
        form.append("aadhaar_passcode", fields.aadhaar_zip_pass);

      const resp = await api.post(API_ROUTES.kyc.aadhaar, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (mounted.current) {
        setLastResponses((s) => ({ ...s, AADHAAR: resp.data }));
        setGlobalResult({
          ok: true,
          message: resp.data?.message || "Aadhaar submitted",
        });
        setErrors({});
        // refresh both kyc and customer so UI updates
        await Promise.allSettled([refreshKyc(), refreshCustomer?.()]);
      }
    } catch (err) {
      const payload = err?.response?.data || {};
      setGlobalResult({
        ok: false,
        message: payload?.error || err?.message || "Aadhaar submission failed",
      });
      if (payload?.errors) setErrors((s) => ({ ...s, ...payload.errors }));
    } finally {
      if (mounted.current) setLoadingAadhaar(false);
    }
  };

  // Submit PAN
  const submitPan = async () => {
    setGlobalResult(null);
    if (!validatePan()) return;
    setLoadingPan(true);
    try {
      const form = new FormData();
      if (fields.pan_no)
        form.append("pan_no", String(fields.pan_no).toUpperCase());
      if (files.pan) form.append("pan_file", files.pan);
      if (fields.pan_pdf_pass)
        form.append("pan_pdf_passcode", fields.pan_pdf_pass);

      const resp = await api.post(API_ROUTES.kyc.pan, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (mounted.current) {
        setLastResponses((s) => ({ ...s, PAN: resp.data }));
        setGlobalResult({
          ok: true,
          message: resp.data?.message || "PAN submitted",
        });
        setErrors({});
        // refresh both kyc and customer so UI updates
        await Promise.allSettled([refreshKyc(), refreshCustomer?.()]);
      }
    } catch (err) {
      const payload = err?.response?.data || {};
      setGlobalResult({
        ok: false,
        message: payload?.error || err?.message || "PAN submission failed",
      });
      if (payload?.errors) setErrors((s) => ({ ...s, ...payload.errors }));
    } finally {
      if (mounted.current) setLoadingPan(false);
    }
  };

  const goBack = () => navigate("/profile");

  const overallKycStatus = useMemo(() => {
    // prefer customer.kyc_status; else derive from per-type statuses
    if (customer?.kyc_status) return customer.kyc_status;
    const aad = kyc.AADHAAR?.status ?? lastResponses.AADHAAR?.status;
    const pan = kyc.PAN?.status ?? lastResponses.PAN?.status;
    if (aad === "NEEDS_REVIEW" || pan === "NEEDS_REVIEW") return "NEEDS_REVIEW";
    if (aad === "VERIFIED" && pan === "VERIFIED") return "VERIFIED";
    if (aad || pan) return "PENDING";
    return "NOT_SUBMITTED";
  }, [customer, kyc, lastResponses]);

  return (
    <MotionFadeIn>
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <h1 className="text-2xl font-semibold mt-4">
              Update KYC Documents
            </h1>
            <Text variant="muted" className="mt-1">
              Upload PAN & Aadhaar documents separately. You can submit one at a
              time.
            </Text>
          </div>

          <div>
            <Badge>
              {overallKycStatus === "VERIFIED"
                ? "Verified"
                : overallKycStatus === "NEEDS_REVIEW"
                ? "Needs review"
                : overallKycStatus}
            </Badge>
          </div>
        </div>

        {custLoading || kycLoading ? (
          <div className="space-y-4">
            <KycSkeleton title="PAN" />
            <KycSkeleton title="Aadhaar" />
          </div>
        ) : (
          <div className="space-y-6">
            <KycTypeCard
              type="PAN"
              status={
                kyc.PAN?.status ||
                lastResponses.PAN?.status ||
                customer?.kyc_status
              }
              parsed={kyc.PAN?.parsed || lastResponses.PAN?.parsed || null}
              lastResponse={lastResponses.PAN}
              loading={loadingPan}
              onChangeField={(n, v) => {
                if (n === "clear") {
                  setFiles((s) => ({ ...s, pan: null }));
                  setFields((s) => ({ ...s, pan_no: "", pan_pdf_pass: "" }));
                  setErrors({});
                } else setFields((s) => ({ ...s, [n]: v }));
              }}
              onSelectFile={(f) => onSelectFile("pan", f)}
              onSubmit={submitPan}
              fields={{
                pan_no: fields.pan_no,
                pan_pdf_pass: fields.pan_pdf_pass,
              }}
              errors={errors}
            />

            <KycTypeCard
              type="AADHAAR"
              status={
                kyc.AADHAAR?.status ||
                lastResponses.AADHAAR?.status ||
                customer?.kyc_status
              }
              parsed={
                kyc.AADHAAR?.parsed || lastResponses.AADHAAR?.parsed || null
              }
              lastResponse={lastResponses.AADHAAR}
              loading={loadingAadhaar}
              onChangeField={(n, v) => {
                if (n === "clear") {
                  setFiles((s) => ({ ...s, aadhaar: null }));
                  setFields((s) => ({
                    ...s,
                    aadhaar_no: "",
                    aadhaar_pdf_pass: "",
                    aadhaar_zip_pass: "",
                  }));
                  setErrors({});
                } else setFields((s) => ({ ...s, [n]: v }));
              }}
              onSelectFile={(f) => onSelectFile("aadhaar", f)}
              onSubmit={submitAadhaar}
              fields={{
                aadhaar_no: fields.aadhaar_no,
                aadhaar_pdf_pass: fields.aadhaar_pdf_pass,
                aadhaar_zip_pass: fields.aadhaar_zip_pass,
              }}
              errors={errors}
            />

            {globalResult && (
              <div
                className={`p-3 rounded ${
                  globalResult.ok
                    ? "bg-green-50 text-emerald-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                {globalResult.ok ? (
                  <Check className="inline-block mr-2 w-4 h-4 align-middle" />
                ) : (
                  <AlertCircle className="inline-block mr-2 w-4 h-4 align-middle" />
                )}
                <span className="align-middle">{globalResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </MotionFadeIn>
  );
}
