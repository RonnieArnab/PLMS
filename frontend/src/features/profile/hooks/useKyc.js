// src/features/kyc/hooks/useKYC.js
import { useCallback, useEffect, useState } from "react";
import api from "@api/api";

/**
 * useKYC - fetch latest KYC records for current user
 * Expected server response shape:
 * {
 *   ok: true,
 *   records: {
 *     AADHAAR: { id, status, confidence, parsed, xmlDownloadRoute, ... },
 *     PAN: { id, status, confidence, parsed, xmlDownloadRoute, ... }
 *   }
 * }
 */
export default function useKYC({ autoFetch = true } = {}) {
  const [kyc, setKyc] = useState({ AADHAAR: null, PAN: null });
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/kyc/latest");
      const data = res?.data ?? null;
      if (!data || !data.ok) {
        setKyc({ AADHAAR: null, PAN: null });
        setError(data?.error || "Empty response");
        setLoading(false);
        return { ok: false, error: data?.error || "Empty response" };
      }
      const recs = data.records || {};
      setKyc({
        AADHAAR: recs.AADHAAR ?? null,
        PAN: recs.PAN ?? null,
      });
      setLoading(false);
      return { ok: true, records: recs };
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed";
      setError(msg);
      setKyc({ AADHAAR: null, PAN: null });
      setLoading(false);
      return { ok: false, error: msg };
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchLatest().catch(() => {});
  }, [autoFetch, fetchLatest]);

  return {
    kyc,
    loading,
    error,
    refresh: fetchLatest,
  };
}
