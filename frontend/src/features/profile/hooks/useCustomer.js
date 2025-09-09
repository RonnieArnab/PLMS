// src/hooks/useCustomer.js
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@context/AuthContext";

/**
 * useCustomer - wrapper around AuthContext fetchCustomer/updateCustomer
 * Returns: { customer, loading, error, refreshCustomer, updateCustomer }
 */
export default function useCustomer() {
  const auth = useAuth?.() ?? {};
  const { user: authUser, fetchCustomer, updateCustomer } = auth;

  const buildFromAuth = (u) => {
    if (!u) return null;
    const {
      customer_id,
      full_name,
      aadhaar_no,
      pan_no,
      profession,
      years_experience,
      annual_income,
      kyc_status,
      address,
      account_id,
      ...rest
    } = u;
    if (customer_id || pan_no || aadhaar_no) {
      return {
        customer_id,
        full_name,
        aadhaar_no,
        pan_no,
        profession,
        years_experience,
        annual_income,
        kyc_status,
        address,
        account_id,
        ...rest,
      };
    }
    return null;
  };

  const initial = buildFromAuth(authUser);
  const [customer, setCustomer] = useState(initial);
  const [loading, setLoading] = useState(
    initial ? false : typeof fetchCustomer === "function"
  );
  const [error, setError] = useState(null);

  const refreshCustomer = useCallback(async () => {
    if (typeof fetchCustomer !== "function") {
      const err = "fetchCustomer not available";
      setError(err);
      setLoading(false);
      return { ok: false, error: err };
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCustomer();
      if (!res?.ok) {
        setError(res?.error || "Failed to fetch customer");
        setCustomer(null);
        setLoading(false);
        return { ok: false, error: res?.error || "Failed" };
      }
      setCustomer(res.customer ?? null);
      setLoading(false);
      return { ok: true, customer: res.customer ?? null };
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      setCustomer(null);
      setLoading(false);
      return { ok: false, error: err };
    }
  }, [fetchCustomer]);

  const doUpdateCustomer = useCallback(
    async (payload) => {
      if (typeof updateCustomer !== "function") {
        const err = "updateCustomer not available";
        setError(err);
        return { ok: false, error: err };
      }
      setLoading(true);
      setError(null);
      try {
        const res = await updateCustomer(payload);
        if (!res?.ok) {
          setError(res?.error || "Update failed");
          setLoading(false);
          return { ok: false, error: res?.error || "Update failed" };
        }
        setCustomer(res.customer ?? null);
        setLoading(false);
        return { ok: true, customer: res.customer ?? null };
      } catch (err) {
        const msg = err?.message || String(err);
        setError(msg);
        setLoading(false);
        return { ok: false, error: err };
      }
    },
    [updateCustomer]
  );

  useEffect(() => {
    // if auth.user contains profile data use it, otherwise fetch proactively
    const candidate = buildFromAuth(authUser);
    if (candidate) {
      setCustomer(candidate);
      setLoading(false);
      setError(null);
      return;
    }
    if (!customer && typeof fetchCustomer === "function") {
      refreshCustomer().catch((e) => {
        // handled inside refreshCustomer - just avoid warning
        // eslint-disable-next-line no-console
        console.warn("refreshCustomer failed:", e);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, fetchCustomer, refreshCustomer]);

  return {
    customer,
    loading,
    error,
    refreshCustomer,
    updateCustomer: doUpdateCustomer,
  };
}
