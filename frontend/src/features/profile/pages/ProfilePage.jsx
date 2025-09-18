// src/features/profile/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import useCustomer from "@features/profile/hooks/useCustomer";
import useKYC from "@features/profile/hooks/useKyc";
import ProfileHeader from "@features/profile/components/ProfileHeader";
import ProfileDetails from "@features/profile/components/ProfileDetails";
import KycCard from "@features/profile/components/KycCard";
import { Text } from "@components/ui/Text";
import { useNavigate, useLocation } from "react-router-dom";

export default function ProfilePage() {
  const {
    customer,
    loading: hookLoading,
    refreshCustomer,
    updateCustomer,
  } = useCustomer();
  const { aadhaar, loading: kycLoading } = useKYC();
  const navigate = useNavigate();
  const location = useLocation();

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // local UI state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [result, setResult] = useState(null);

  // local loading which won't get permanently stuck
  const [localLoading, setLocalLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fallbackTimerRef = useRef(null);
  const initTimeoutRef = useRef(null);

  // form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bankName: "",
    accountMasked: "",
    accountNumber: "",
    accountType: "",
    ifsc: "",
    nominee: "",
    nomineeContact: "",
    employment: "",
    monthlyIncome: "",
    aadhaar: "",
    dateOfBirth: "",
    age: "",
  });

  // helper to start a load and setup fallback timer
  const beginLoading = (timeoutMs = 3000) => {
    if (!isMounted.current) return;
    setLocalLoading(true);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      if (isMounted.current) {
        console.warn(
          "ProfilePage: Loading timeout, clearing local loading state"
        );
        setLocalLoading(false);
      }
      fallbackTimerRef.current = null;
    }, timeoutMs);
  };

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const clearInitTimeout = () => {
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
  };

  // Initial load and page reload handling
  useEffect(() => {
    if (hasInitialized) return;

    setHasInitialized(true);

    // Set up initialization timeout to prevent permanent loading
    initTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && !customer) {
        console.warn(
          "ProfilePage: Initialization timeout, clearing loading state"
        );
        setLocalLoading(false);
        clearFallbackTimer();
      }
    }, 8000); // 8 second timeout for initialization

    // If we already have customer data, don't show loading
    if (customer) {
      setLocalLoading(false);
      clearFallbackTimer();
      clearInitTimeout();
      return;
    }

    // Start loading and attempt to fetch
    beginLoading(3000);
    refreshCustomer(true)
      .catch((err) => {
        console.error("ProfilePage: Initial fetch failed:", err);
      })
      .finally(() => {
        if (!isMounted.current) return;
        clearInitTimeout();
        // Clear loading if we have data or hook is no longer loading
        if (customer || !hookLoading) {
          setLocalLoading(false);
          clearFallbackTimer();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor hook loading state changes
  useEffect(() => {
    if (!isMounted.current || !hasInitialized) return;

    if (!hookLoading || customer) {
      setLocalLoading(false);
      clearFallbackTimer();
    } else if (hookLoading && !customer) {
      // Hook is loading and we don't have customer data
      beginLoading(3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookLoading, customer, hasInitialized]);

  // Refresh when route becomes active (navigating back)
  useEffect(() => {
    if (!hasInitialized) return;

    if (location.pathname && location.pathname.startsWith("/profile")) {
      // Force refresh on route activation
      beginLoading(2000);
      refreshCustomer(true)
        .catch((err) => {
          console.error("ProfilePage: Route refresh failed:", err);
        })
        .finally(() => {
          if (!isMounted.current) return;
          setLocalLoading(false);
          clearFallbackTimer();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.pathname, hasInitialized]);

  // refresh on window focus / visibility (non-forced, rate-limited inside hook)
  useEffect(() => {
    const onFocus = () => {
      beginLoading(1500);
      refreshCustomer(false)
        .catch(() => {})
        .finally(() => {
          if (!isMounted.current) return;
          setLocalLoading(false);
          clearFallbackTimer();
        });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // populate form whenever customer changes
  useEffect(() => {
    const source = customer ?? {};
    const bank = source.bank ?? {
      bank_name: source.bank_name,
      account_number: source.account_number,
      ifsc_code: source.ifsc_code,
      account_type: source.account_type,
      is_primary: source.is_primary,
    };

    const accountNumber = bank?.account_number ?? "";

    setFormData({
      name: source.full_name || source.name || "",
      email: source.email || "",
      phone: source.phone || source.phone_number || "",
      address: source.address || "",
      bankName: bank?.bank_name || "",
      accountMasked:
        accountNumber && accountNumber.length >= 4
          ? "XXXXXX" + accountNumber.slice(-4)
          : accountNumber || "",
      accountNumber,
      accountType: bank?.account_type || "",
      ifsc: bank?.ifsc_code || "",
      nominee: source.nominee || "",
      nomineeContact: source.nominee_contact || "",
      employment: source.profession || "",
      monthlyIncome: source.annual_income
        ? (Number(source.annual_income) / 12).toFixed(2)
        : "",
      aadhaar: source.aadhaar_no || "",
      dateOfBirth: source.date_of_birth || "",
      age: source.age ?? "",
    });
  }, [customer]);

  // cleanup any timers on unmount
  useEffect(() => {
    return () => {
      clearFallbackTimer();
      clearInitTimeout();
    };
  }, []);

  const initials = useMemo(() => {
    const source = formData.name || formData.email || "U";
    return source
      .split(" ")
      .map((part) => (part ? part[0] : ""))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [formData]);

  const handleAvatar = (file) => {
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      if (typeof updateCustomer !== "function")
        throw new Error("Update function not available");

      const updateData = {
        full_name: formData.name || undefined,
        profession: formData.employment || undefined,
        annual_income:
          formData.monthlyIncome !== ""
            ? Number(formData.monthlyIncome) * 12
            : undefined,
        address: formData.address || undefined,
        nominee: formData.nominee || undefined,
        nominee_contact: formData.nomineeContact || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        phone: formData.phone || undefined,
        bank_name: formData.bankName || undefined,
        account_number: formData.accountNumber || undefined,
        account_type: formData.accountType || undefined,
        ifsc_code: formData.ifsc || undefined,
      };

      Object.keys(updateData).forEach((k) => {
        if (
          updateData[k] === "" ||
          updateData[k] === null ||
          updateData[k] === undefined
        ) {
          delete updateData[k];
        }
      });

      const response = await updateCustomer(updateData);

      if (response?.ok) {
        setSaving(false);
        setEditing(false);
        setResult({ ok: true, message: "Profile updated successfully!" });
        setTimeout(() => setResult(null), 2500);
        // force a fresh reload and show loader while fetching
        beginLoading(1500);
        await refreshCustomer(true);
        if (isMounted.current) {
          setLocalLoading(false);
          clearFallbackTimer();
        }
      } else {
        const message = response?.error || "Update failed";
        throw new Error(
          typeof message === "string" ? message : JSON.stringify(message)
        );
      }
    } catch (error) {
      setSaving(false);
      setResult({ ok: false, message: error.message || "Save failed." });
      setTimeout(() => setResult(null), 2500);
    }
  };

  const handleApprove = () => {
    if (!window.confirm("Approve changes for this profile?")) return;
    window.alert("Profile approved (simulated).");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(formData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleVCard = () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${formData.name}`,
      `EMAIL:${formData.email}`,
      `TEL:${formData.phone}`,
      `ADR:${(formData.address || "").replace(/\n/g, ";")}`,
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contact_${formData.name || "profile"}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This is irreversible."
      )
    )
      return;
    window.alert("Account deletion simulated.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <ProfileHeader
          loading={localLoading}
          initials={initials}
          preview={avatarPreview}
          name={formData.name}
          email={formData.email}
          premium
          onAvatar={handleAvatar}
          onEditToggle={() => setEditing((e) => !e)}
          editing={editing}
          disabled={localLoading || saving}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProfileDetails
              loading={localLoading}
              editing={editing}
              formData={formData}
              onChange={handleChange}
              onSave={() => editing && handleSave()}
              onApprove={handleApprove}
              saving={saving}
            />
          </div>

          <div className="space-y-6">
            <KycCard
              loading={kycLoading}
              kyc={{
                aadhaar_status: aadhaar?.status,
                aadhaar,
              }}
              onUpdate={() => navigate("/profile/kyc")}
            />

            <div>
              <Text variant="muted" className="mb-2">
                IDs
              </Text>

              <div className="p-4 rounded-lg bg-base-200/50 mb-4">
                <div className="text-sm text-base-content/60">Aadhaar</div>
                <div className="font-medium">{formData.aadhaar || "—"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full rounded px-4 py-2 border"
                disabled={localLoading || saving}>
                Export JSON
              </button>
              <button
                onClick={handleVCard}
                className="w-full rounded px-4 py-2 border"
                disabled={localLoading || saving}>
                Download vCard
              </button>
              <button
                onClick={handleDelete}
                className="w-full rounded px-4 py-2 border text-red-600"
                disabled={localLoading || saving}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div
          className={`fixed bottom-6 right-8 z-50 px-6 py-3 rounded-lg shadow-lg ${
            result.ok ? "bg-green-700 text-white" : "bg-red-600 text-white"
          }`}>
          {result.message}
        </div>
      )}
    </DashboardLayout>
  );
}
