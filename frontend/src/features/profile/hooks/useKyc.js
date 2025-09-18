// src/features/kyc/hooks/useKyc.js
import { useCallback, useEffect, useState } from "react";
import api from "@api/api";

/**
 * useKYC - simplified: only Aadhaar
 * Server expected shape for /api/kyc/status:
 * { ok: true, status: { customer_id, aadhaar_no, aadhaar_kyc_status, kyc_status, latest_kyc_id } }
 */
export default function useKYC({ autoFetch = true } = {}) {
  const [aadhaar, setAadhaar] = useState(null);
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/kyc/status");
      const data = res?.data ?? null;
      if (!data || !data.ok) {
        setAadhaar(null);
        setError(data?.error || "Empty response");
        setLoading(false);
        return { ok: false, error: data?.error || "Empty response" };
      }
      // server returns a snapshot; adapt to UI shape
      const s = data.status || {};
      setAadhaar({
        customer_id: s.customer_id || null,
        aadhaar_no: s.aadhaar_no || null,
        status: s.aadhaar_kyc_status || s.kyc_status || null,
        latest_kyc_id: s.latest_kyc_id || null,
      });
      setLoading(false);
      return { ok: true, aadhaar: s };
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed";
      setError(msg);
      setAadhaar(null);
      setLoading(false);
      return { ok: false, error: msg };
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchLatest().catch(() => {});
  }, [autoFetch, fetchLatest]);

  return {
    aadhaar,
    loading,
    error,
    refresh: fetchLatest,
  };
}
