// src/pages/KycUpdatePage.jsx
import React, { useEffect, useRef, useState } from "react";
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
  const { aadhaar, loading: kycLoading, refresh: refreshKyc } = useKYC();
  const navigate = useNavigate();
  const mounted = useRef(true);

  const [fields, setFields] = useState({
    aadhaar_no: "",
    aadhaar_pdf_pass: "",
    aadhaar_zip_pass: "",
  });

  const [files, setFiles] = useState({ aadhaar: null });
  const [loadingAadhaar, setLoadingAadhaar] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastResponse, setLastResponse] = useState(null);
  const [globalResult, setGlobalResult] = useState(null);

  useEffect(() => {
    mounted.current = true;
    setFields((prev) => ({
      ...prev,
      aadhaar_no:
        prev.aadhaar_no || aadhaar?.aadhaar_no || customer?.aadhaar_no || "",
    }));
    setLastResponse(aadhaar || null);
    return () => {
      mounted.current = false;
    };
  }, [customer, aadhaar]);

  const onChangeField = (name, value) => {
    if (name === "clear") {
      setFiles({ aadhaar: null });
      setFields({ aadhaar_no: "", aadhaar_pdf_pass: "", aadhaar_zip_pass: "" });
      setErrors({});
      setGlobalResult(null);
      return;
    }
    setFields((s) => ({ ...s, [name]: value }));
  };

  const onSelectFile = (which, file) =>
    setFiles((s) => ({ ...s, [which]: file }));

  const validateAadhaar = () => {
    const e = {};
    const aadNo = String(fields.aadhaar_no || "").replace(/\D/g, "");
    if (fields.aadhaar_no && !/^\d{12}$/.test(aadNo)) {
      e.aadhaar_no = "Aadhaar must be 12 digits";
    }
    const f = files.aadhaar;
    if (f) {
      if (!ACCEPTED_FILE_TYPES.includes(f.type))
        e.aadhaar_file = "Aadhaar file must be PNG/JPG/PDF";
      if (f.size / 1024 / 1024 > MAX_FILE_MB)
        e.aadhaar_file = `Aadhaar file must be <= ${MAX_FILE_MB}MB`;
    }
    setErrors((s) => ({ ...s, ...e }));
    return Object.keys(e).length === 0;
  };

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
        setLastResponse(resp.data);
        setGlobalResult({
          ok: true,
          message: resp.data?.message || "Aadhaar submitted",
        });
        setErrors({});
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

  const goBack = () => navigate("/profile");

  const overallKycStatus = (() => {
    if (customer?.kyc_status) return customer.kyc_status;
    if (aadhaar?.status) return aadhaar.status;
    if (lastResponse?.status) return lastResponse.status;
    return "NOT_SUBMITTED";
  })();

  return (
    <MotionFadeIn>
      <div className="max-w-3xl mx-auto p-6">
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
              Update Aadhaar Document
            </h1>
            <Text variant="muted" className="mt-1">
              Upload Aadhaar PDF or image. You can submit Aadhaar here.
            </Text>
          </div>

          <div>
            <Badge>
              {overallKycStatus === "VERIFIED" ? "Verified" : overallKycStatus}
            </Badge>
          </div>
        </div>

        {custLoading || kycLoading ? (
          <div className="space-y-4">
            <KycSkeleton title="Aadhaar" />
          </div>
        ) : (
          <div className="space-y-6">
            <KycTypeCard
              type="AADHAAR"
              status={
                aadhaar?.status || lastResponse?.status || customer?.kyc_status
              }
              parsed={aadhaar?.parsed || lastResponse?.parsed || null}
              lastResponse={lastResponse}
              loading={loadingAadhaar}
              onChangeField={(n, v) => {
                if (n === "clear") onChangeField("clear", true);
                else onChangeField(n, v);
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
