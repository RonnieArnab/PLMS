import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@context/AuthContext";

export default function useCustomer() {
  const auth = useAuth?.() ?? {};
  const { user: authUser, fetchCustomer, updateCustomer } = auth;

  // Extract and map customer profile fields from authUser object
  const buildFromAuth = useCallback((u) => {
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
      nominee,
      nominee_contact,
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
        nominee,
        nominee_contact,
        ...rest,
      };
    }
    return null;
  }, []);

  // Initial customer state derived from auth context user if available
  const initial = buildFromAuth(authUser);

  const [customer, setCustomer] = useState(initial);
  const [loading, setLoading] = useState(
    initial ? false : typeof fetchCustomer === "function"
  );
  const [error, setError] = useState(null);

  // Function to refresh customer data by calling fetchCustomer()
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

  // Function to update customer profile by calling updateCustomer()
  const updateCustomerData = useCallback(
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

  // Effect to initialize or refresh customer data on auth changes
  useEffect(() => {
    const candidate = buildFromAuth(authUser);
    if (candidate) {
      setCustomer(candidate);
      setLoading(false);
      setError(null);
      return;
    }
    if (!customer && typeof fetchCustomer === "function") {
      refreshCustomer().catch(() => {
        // suppress unhandled rejections in effect
      });
    }
  }, [authUser, fetchCustomer, refreshCustomer, customer, buildFromAuth]);

  return {
    customer,
    loading,
    error,
    refreshCustomer,
    updateCustomer: updateCustomerData,
  };
}
