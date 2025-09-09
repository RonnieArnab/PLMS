// src/features/auth/components/KycReminder.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@components/ui/Button.jsx";
import { useNavigate } from "react-router-dom";
import api from "@api/api";

/**
 * KycReminder
 *
 * Behavior:
 * - Shows if localStorage.kyc_pending === "true" OR server reports incomplete profile.
 * - Server check uses GET /api/customer/me (expects { customerprofile: { ... } } or similar).
 * - Buttons:
 *    * "Complete now" -> navigate("/dashboard/profile")
 *    * "I've updated details — re-check" -> calls server again, hides if complete
 *    * "Dismiss" -> clears localStorage flag and hides (local only)
 *
 * Notes:
 * - If your server endpoint differs, change the GET URL or response parsing accordingly.
 * - This component is defensive — any server error will show a small message but won't crash the app.
 */

export default function KycReminder() {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [serverProfile, setServerProfile] = useState(null);
  const navigate = useNavigate();

  // Determine if profile is complete enough
  const isProfileComplete = (profile) => {
    if (!profile) return false;
    // Customize these checks to match your requirements:
    // - full_name present
    // - aadhaar_no or pan_no present (you may require both)
    // - account_id present (bank details saved)
    // - kyc_status !== 'PENDING'
    const hasName = !!profile.full_name;
    const hasId = !!profile.aadhaar_no || !!profile.pan_no;
    const hasAccount = !!profile.account_id;
    const kycOk =
      typeof profile.kyc_status === "string"
        ? profile.kyc_status.toUpperCase() === "VERIFIED"
        : false;

    // Consider complete if name + (id or account) present OR explicitly VERIFIED
    return kycOk || (hasName && (hasId || hasAccount));
  };

  // check server for customer profile
  const checkServerProfile = useCallback(async () => {
    setChecking(true);
    setServerError(null);
    try {
      // Adjust endpoint if needed. We expect the server to return the profile for current user.
      const res = await api.get("/api/customer/me");
      // Possible shapes:
      //  - { customer: { ... } }
      //  - { data: { ... } }
      //  - raw object
      const payload = res?.data;
      let profile = null;
      if (!payload) profile = null;
      else if (payload.customer) profile = payload.customer;
      else if (payload.customerprofile) profile = payload.customerprofile;
      else profile = payload;

      setServerProfile(profile);

      const complete = isProfileComplete(profile);

      // show if incomplete
      if (!complete) {
        setVisible(true);
        try {
          localStorage.setItem("kyc_pending", "true");
        } catch (_) {}
      } else {
        // server says complete -> clear local flag and hide reminder
        try {
          localStorage.removeItem("kyc_pending");
        } catch (_) {}
        setVisible(false);
      }
    } catch (err) {
      // don't hide the reminder on error; show a small message
      setServerError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not check profile status (network)."
      );
      // keep visible if local flag was set
      const local = localStorage.getItem("kyc_pending") === "true";
      setVisible(local);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // initial visibility: localStorage flag or will be set by server check
    try {
      const local = localStorage.getItem("kyc_pending") === "true";
      if (local) {
        setVisible(true);
      }
    } catch (_) {
      // ignore
    }

    // run server check (best effort)
    checkServerProfile();

    // keep in sync with other tabs via storage event
    const onStorage = (e) => {
      if (e.key === "kyc_pending") {
        const local = e.newValue === "true";
        if (!local) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [checkServerProfile]);

  const onDismiss = () => {
    try {
      localStorage.removeItem("kyc_pending");
    } catch (_) {}
    setVisible(false);
  };

  const onCompleteNow = () => {
    // navigate to profile page where user can update KYC/bank details
    navigate("/dashboard/profile");
  };

  const onRecheck = async () => {
    await checkServerProfile();
    // if server says complete, hide
    if (serverProfile && isProfileComplete(serverProfile)) {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-lg p-4 bg-yellow-50 border border-yellow-100 text-yellow-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold">Complete your profile</h3>
          <p className="text-sm text-yellow-800/80 mt-1">
            You skipped adding KYC and/or bank details earlier — complete them
            now to apply for loans and get faster disbursements.
          </p>

          {serverError && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {serverError}
            </div>
          )}

          {checking && (
            <div className="mt-2 text-xs text-slate-600">Checking status…</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onCompleteNow}
            variant="solid"
            className="whitespace-nowrap">
            Complete now
          </Button>

          <Button
            onClick={onRecheck}
            variant="outline"
            className="whitespace-nowrap"
            disabled={checking}>
            I've updated — re-check
          </Button>

          <Button
            onClick={onDismiss}
            variant="ghost"
            className="whitespace-nowrap">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
