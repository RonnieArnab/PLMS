import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import { useAuth } from "@context/AuthContext";

import ProfileHeader from "@features/profile/components/ProfileHeader";
import ProfileDetails from "@features/profile/components/ProfileDetails.jsx";
import SecurityCard from "@features/profile/components/SecurityCard.jsx";
import KycCard from "@features/profile/components/KycCard.jsx";
import QuickActions from "@features/profile/components/QuickActions.jsx";
import { Text } from "@components/ui/Text.jsx";
import { useNavigate } from "react-router-dom";

import useKYC from "@features/profile/hooks/useKyc";
/**
 * Top-level Profile page assembled from smaller components.
 * - loading skeletons preserved
 * - form editing + save simulation
 * - approval button (onApprove) optional
 */

export default function ProfilePage() {
  const { user: authUser } = useAuth() || {};
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  // combined form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bankName: "",
    accountMasked: "",
    ifsc: "",
    nominee: "",
    nomineeContact: "",
    employment: "",
    monthlyIncome: "",
    pan: "",
    aadhaar: "",
  });

  const {
    kyc,
    loading: kycLoading,
    error: kycError,
    refresh: refreshKyc,
  } = useKYC();
  useEffect(() => {
    setLoading(true);
    // simulate fetch user profile
    const t = setTimeout(() => {
      const mock = {
        name: authUser?.name ?? "Arnab Ghosh",
        email: authUser?.email ?? "arnab@example.com",
        phone: authUser?.phone ?? "+91 98765 43210",
        address:
          authUser?.address ??
          "12/4, Park Street, Kolkata, West Bengal, India - 700017",
        bankName: "HDFC Bank",
        accountMasked: "XXXXXX1234",
        ifsc: "HDFC0001234",
        nominee: "S. Ghosh",
        nomineeContact: "+91 99999 88888",
        employment: "Clinic Owner",
        monthlyIncome: "125,000",
        pan: "ABCDE1234F",
        aadhaar: "XXXX-XXXX-1234",
      };
      setFormData(mock);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, [authUser]);

  const initials = useMemo(() => {
    const nm = formData.name || formData.email || "U";
    return nm
      .split(" ")
      .map((p) => p[0])
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
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      // simulate API call
      await new Promise((r) => setTimeout(r, 900));
      setSaving(false);
      setEditing(false);
      setResult({ ok: true, message: "Profile saved." });
      setTimeout(() => setResult(null), 2500);
    } catch (err) {
      setSaving(false);
      setResult({ ok: false, message: "Save failed." });
      setTimeout(() => setResult(null), 2500);
    }
  };

  const handleApprove = () => {
    // simulate an approval action (for admins)
    if (!confirm("Approve changes for this profile?")) return;
    alert("Profile approved (simulated).");
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
      !confirm(
        "Are you sure you want to delete your account? This is irreversible."
      )
    )
      return;
    alert("Account deletion simulated.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <ProfileHeader
          loading={loading}
          initials={initials}
          preview={avatarPreview}
          name={formData.name}
          email={formData.email}
          premium={true}
          onAvatar={handleAvatar}
          onEditToggle={() => setEditing((s) => !s)}
          editing={editing}
          disabled={loading || saving}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProfileDetails
              loading={loading}
              editing={editing}
              formData={formData}
              onChange={handleChange}
              onSave={() => {
                if (editing) handleSave();
              }}
              onApprove={handleApprove}
              saving={saving}
            />
          </div>

          <div className="space-y-6">
            <SecurityCard
              loading={loading}
              security={{}}
              onManage={() => alert("Manage security (simulated)")}
            />
            <KycCard
              loading={kycLoading}
              kyc={{
                pan_status: kyc?.pan?.status,
                aadhaar_status: kyc?.aadhaar?.status,
                pan: kyc?.pan,
                aadhaar: kyc?.aadhaar,
              }}
              onUpdate={() => navigate("/profile/kyc")}
            />
            <div>
              <Text variant="muted" className="mb-2">
                Tax & IDs
              </Text>
              <div className="p-4 rounded-lg bg-base-200/50 mb-4">
                <div className="text-sm text-base-content/60">PAN</div>
                <div className="font-medium">{formData.pan || "—"}</div>
              </div>
              <div className="p-4 rounded-lg bg-base-200/50 mb-4">
                <div className="text-sm text-base-content/60">Aadhaar</div>
                <div className="font-medium">{formData.aadhaar || "—"}</div>
              </div>
            </div>

            <QuickActions
              onExport={handleExport}
              onDownloadVCard={handleVCard}
              onDelete={handleDelete}
              disabled={loading || saving}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
