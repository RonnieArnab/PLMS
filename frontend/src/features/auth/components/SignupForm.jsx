// src/features/auth/pages/SignupForm.jsx
import React, { useState } from "react";
import BasicSignupForm from "@features/auth/components/BasicSignupForm.jsx";
import VerifyEmailPage from "@features/auth/pages/VerifyEmailPage.jsx";
import CustomerDetailsPage from "@features/auth/pages/CustomerDetailsPage.jsx";
import { useNavigate } from "react-router-dom";

/**
 * SignupForm — orchestrates signup flow:
 *  - basic -> verify -> details
 *
 * Notes:
 *  - BasicSignupForm calls onSignedUp({ user }) or onSignedUp({ email })
 *  - After sign-up we show VerifyEmailPage which polls for verification.
 *  - When verification completes we redirect the browser to the backend /verify-email
 *    /verify-success flow to ensure refresh cookie is accepted by the browser.
 */
export default function SignupForm({ onToggleMode = () => {} }) {
  const [step, setStep] = useState("basic"); // basic | verify | details
  const [pendingEmail, setPendingEmail] = useState("");
  const [basicData, setBasicData] = useState(null);
  const navigate = useNavigate();

  const handleSignedUp = ({ email, user, basic } = {}) => {
    // BasicSignupForm may send { user } or { email } depending on implementations.
    const finalEmail = email || user?.email || (basic && basic.email) || "";
    setPendingEmail(finalEmail);
    setBasicData(basic || user || null);
    setStep("verify");
  };

  const handleVerified = () => {
    // Prefer backend-assisted redirect to ensure refresh cookie is set by backend
    // Backend verify endpoint will redirect to frontend /verify-success?next=...
    // We open that path so the browser accepts the refresh cookie set by the backend.
    const next = encodeURIComponent("/profile/details");
    // Use absolute path to backend verify endpoint only if your verification links contain tokens.
    // The verification email will point to backend /api/auth/verify-email?token=...
    // After the user clicks the email link, backend will set cookie and redirect to frontend /verify-success.
    // To follow the backend-assisted flow we navigate the SPA to /verify-success which will call restoreSession().
    // If your backend directly redirects to the frontend verify-success, this still works.
    window.location.href = `/verify-success?next=${next}`;
  };

  const handleDetailsComplete = () => {
    navigate("/dashboard");
  };

  return (
    <>
      {step === "basic" && (
        <BasicSignupForm
          onToggleMode={onToggleMode}
          onSignedUp={handleSignedUp}
        />
      )}

      {step === "verify" && (
        <VerifyEmailPage email={pendingEmail} onVerified={handleVerified} />
      )}

      {step === "details" && (
        <CustomerDetailsPage onComplete={handleDetailsComplete} />
      )}
    </>
  );
}
