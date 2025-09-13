import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import { useAuth } from "@context/AuthContext";
import useCustomer from "@features/profile/hooks/useCustomer";
import useKYC from "@features/profile/hooks/useKyc";
import ProfileHeader from "@features/profile/components/ProfileHeader";
import ProfileDetails from "@features/profile/components/ProfileDetails";
import SecurityCard from "@features/profile/components/SecurityCard";
import KycCard from "@features/profile/components/KycCard";
import QuickActions from "@features/profile/components/QuickActions";
import { Text } from "@components/ui/Text";
import { useNavigate } from "react-router-dom";

/**
 * Top-level Profile page assembled from smaller components.
 * - Includes loading, form editing + save simulation.
 * - Approval actions & export/download functionality.
 */

export default function ProfilePage() {
  const auth = useAuth();
  const { user: authUser, updateCustomer } = auth || {};
  const { customer, loading: customerLoading, refreshCustomer } = useCustomer();
  const {
    kyc,
    loading: kycLoading,
    // error: kycError,
    // refresh: refreshKyc,
  } = useKYC();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();

  // Form data with comprehensive fields
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
    dateOfBirth: "",
    age: "",
  });

  // Populate form from user and customer data
  useEffect(() => {
    if (!customerLoading && customer) {
      const mapped = {
        name: customer.full_name || authUser?.name || "",
        email: authUser?.email || "",
        phone: authUser?.phone || customer.phone || "",
        address: customer.address || "",
        bankName: customer.bank_name || "",
        accountMasked: customer.account_number
          ? "XXXXXX" + customer.account_number.slice(-4)
          : "",
        ifsc: customer.ifsc_code || "",
        nominee: customer.nominee || "",
        nomineeContact: customer.nominee_contact || "",
        employment: customer.profession || "",
        monthlyIncome: customer.annual_income
          ? (customer.annual_income / 12).toFixed(2)
          : "",
        pan: customer.pan_no || "",
        aadhaar: customer.aadhaar_no || "",
        dateOfBirth: customer.date_of_birth || "",
        age: customer.age || "",
      };
      setFormData(mapped);
      setLoading(false);
    }
  }, [customer, customerLoading, authUser]);

  // Initials for avatar fallback
  const initials = useMemo(() => {
    const source = formData.name || formData.email || "U";
    return source
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [formData]);

  // Avatar file handler
  const handleAvatar = (file) => {
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save profile data using real API call
  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      if (!updateCustomer) {
        throw new Error("Update function not available");
      }

      // Prepare data for API
      const updateData = {
        full_name: formData.name,
        profession: formData.employment,
        annual_income: formData.monthlyIncome
          ? parseFloat(formData.monthlyIncome) * 12
          : null,
        address: formData.address,
        nominee: formData.nominee,
        nominee_contact: formData.nomineeContact,
        date_of_birth: formData.dateOfBirth,
      };

      // Remove empty fields
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] === "" ||
          updateData[key] === null ||
          updateData[key] === undefined
        ) {
          delete updateData[key];
        }
      });

      const response = await updateCustomer(updateData);

      if (response.ok) {
        setSaving(false);
        setEditing(false);
        setResult({ ok: true, message: "Profile updated successfully!" });
        setTimeout(() => setResult(null), 2500);

        // Refresh customer data
        if (refreshCustomer) {
          await refreshCustomer();
        }
      } else {
        throw new Error(response.error || "Update failed");
      }
    } catch (error) {
      setSaving(false);
      setResult({ ok: false, message: error.message || "Save failed." });
      setTimeout(() => setResult(null), 2500);
    }
  };

  // Approve action simulation (admin)
  const handleApprove = () => {
    if (!window.confirm("Approve changes for this profile?")) return;
    window.alert("Profile approved (simulated).");
  };

  // Export JSON profile
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

  // Download vCard file
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

  // Account delete action simulation
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
          loading={loading}
          initials={initials}
          preview={avatarPreview}
          name={formData.name}
          email={formData.email}
          premium={true}
          onAvatar={handleAvatar}
          onEditToggle={() => setEditing((e) => !e)}
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
              onSave={() => editing && handleSave()}
              onApprove={handleApprove}
              saving={saving}
            />
          </div>

          <div className="space-y-6">
            <SecurityCard
              loading={loading}
              security={{}}
              onManage={() => window.alert("Manage security (simulated)")}
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
