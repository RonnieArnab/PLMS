import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@context/AuthContext";

export default function useCustomer() {
  const auth = useAuth?.() ?? {};
  const {
    user: authUser,
    fetchCustomer,
    updateCustomer: authUpdateCustomer,
    setUser,
  } = auth;

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const lastFetchedRef = useRef(0);
  const RATE_LIMIT_MS = 3000;

  const normalizeBank = (u) => {
    if (!u) return null;
    if (u.bank && typeof u.bank === "object") return u.bank;
    if (u.account_number || u.bank_name || u.ifsc_code) {
      return {
        account_id: u.account_id ?? null,
        bank_name: u.bank_name ?? null,
        account_number: u.account_number ?? null,
        ifsc_code: u.ifsc_code ?? null,
        account_type: u.account_type ?? null,
        is_primary: u.is_primary ?? null,
      };
    }
    return null;
  };

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
      date_of_birth,
      age,
      created_at,
      ...rest
    } = u;

    const hasCustomerData =
      customer_id ||
      pan_no ||
      aadhaar_no ||
      nominee ||
      date_of_birth ||
      account_id ||
      u.bank ||
      u.bank_name ||
      u.account_number;

    if (!hasCustomerData) return null;

    const bank = normalizeBank(u);

    return {
      customer_id: customer_id ?? null,
      full_name: full_name ?? null,
      aadhaar_no: aadhaar_no ?? null,
      pan_no: pan_no ?? null,
      profession: profession ?? null,
      years_experience: years_experience ?? null,
      annual_income: annual_income ?? null,
      kyc_status: kyc_status ?? null,
      address: address ?? null,
      account_id: account_id ?? null,
      nominee: nominee ?? null,
      nominee_contact: nominee_contact ?? null,
      date_of_birth: date_of_birth ?? null,
      age: age ?? null,
      bank, // normalized bank object
      created_at: created_at ?? null,
      ...rest,
    };
  }, []);

  const initial = buildFromAuth(authUser);

  const [customer, setCustomer] = useState(initial);
  const [loading, setLoading] = useState(
    initial ? false : typeof fetchCustomer === "function"
  );
  const [error, setError] = useState(null);

  // Track if we've attempted an initial fetch to prevent infinite loading
  const hasAttemptedInitialFetch = useRef(false);

  // refreshCustomer(force?: boolean) -> returns {ok, customer}
  const refreshCustomer = useCallback(
    async (force = false) => {
      // rate-limit unless forced
      const now = Date.now();
      if (!force && now - lastFetchedRef.current < RATE_LIMIT_MS) {
        return { ok: true, customer };
      }
      lastFetchedRef.current = now;

      if (typeof fetchCustomer !== "function") {
        // fallback to authUser
        const built = buildFromAuth(authUser) ?? null;
        if (isMounted.current) {
          setCustomer(built);
          setLoading(false);
          setError(null);
        }
        return { ok: true, customer: built };
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetchCustomer();
        if (!isMounted.current) return { ok: false, error: "unmounted" };

        if (!res?.ok) {
          // leave existing customer if present, but surface error
          if (isMounted.current) {
            setError(res?.error || "Failed to fetch customer");
            setLoading(false);
          }
          return { ok: false, error: res?.error || "Failed" };
        }

        const raw = res.customer ?? res.user ?? res;
        const normalized = buildFromAuth(raw) ?? null;

        // Update global auth.user if possible so other pages see new data
        if (normalized) {
          try {
            if (typeof setUser === "function") {
              // merge customer data into auth.user (non-destructive)
              setUser((prev) => ({ ...(prev || {}), ...raw }));
            }
          } catch (e) {
            // ignore setUser errors
          }
        } else {
          // if backend returned a user object, also set it
          if (res.user && typeof setUser === "function") {
            setUser(res.user);
          }
        }

        if (isMounted.current) {
          setCustomer(normalized);
          setLoading(false);
          setError(null);
        }
        return { ok: true, customer: normalized };
      } catch (err) {
        const msg = err?.message || String(err);
        if (isMounted.current) {
          setError(msg);
          setCustomer(null);
          setLoading(false);
        }
        return { ok: false, error: msg };
      }
    },
    [fetchCustomer, authUser, buildFromAuth, setUser, customer]
  );

  const updateCustomerData = useCallback(
    async (payload) => {
      if (typeof authUpdateCustomer !== "function") {
        const err = "updateCustomer not available";
        setError(err);
        return { ok: false, error: err };
      }

      setLoading(true);
      setError(null);
      try {
        const res = await authUpdateCustomer(payload);

        if (!res?.ok) {
          if (isMounted.current) {
            setError(res?.error || "Update failed");
            setLoading(false);
          }
          return { ok: false, error: res?.error || "Update failed" };
        }

        const raw = res.customer ?? res.user ?? res;
        const normalized = buildFromAuth(raw) ?? null;

        // update global auth.user too
        if (typeof setUser === "function") {
          try {
            setUser((prev) => ({ ...(prev || {}), ...raw }));
          } catch (e) {
            // ignore
          }
        }

        if (isMounted.current) {
          setCustomer(normalized);
          setLoading(false);
          setError(null);
        }

        return { ok: true, customer: normalized };
      } catch (err) {
        const msg = err?.message || String(err);
        if (isMounted.current) {
          setError(msg);
          setLoading(false);
        }
        return { ok: false, error: msg };
      }
    },
    [authUpdateCustomer, buildFromAuth, setUser]
  );

  // initialize when authUser changes
  useEffect(() => {
    const candidate = buildFromAuth(authUser);
    if (candidate) {
      setCustomer(candidate);
      setLoading(false);
      setError(null);
      hasAttemptedInitialFetch.current = true;
      return;
    }

    if (
      typeof fetchCustomer === "function" &&
      !hasAttemptedInitialFetch.current
    ) {
      hasAttemptedInitialFetch.current = true;
      // attempt to fetch with timeout fallback
      const timeoutId = setTimeout(() => {
        if (isMounted.current) {
          console.warn(
            "useCustomer: Initial fetch timeout, clearing loading state"
          );
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      refreshCustomer(true)
        .catch(() => {})
        .finally(() => {
          clearTimeout(timeoutId);
        });
    } else if (!hasAttemptedInitialFetch.current) {
      setCustomer(null);
      setLoading(false);
      hasAttemptedInitialFetch.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  return {
    customer,
    loading,
    error,
    refreshCustomer,
    updateCustomer: updateCustomerData,
    setCustomer,
  };
}
