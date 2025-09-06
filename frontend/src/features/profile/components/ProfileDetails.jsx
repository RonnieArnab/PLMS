import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";

/**
 * ProfileDetails shows personal + extended user info.
 * Props:
 *  - loading
 *  - editing
 *  - formData { name,email,phone,address,bankName,accountMasked,ifsc,nominee,nomineeContact,employment,monthlyIncome }
 *  - onChange(e) for text inputs
 *  - onSave()
 *  - onApprove() - optional admin approval
 */
export default function ProfileDetails({
  loading,
  editing,
  formData,
  onChange,
  onSave,
  onApprove,
  saving,
}) {
  if (loading) {
    return (
      <MotionFadeIn>
        <Card className="rounded-lg shadow-lg">
          <div className="p-6 space-y-4">
            <div className="h-6 w-1/3 bg-base-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 gap-4">
              <div className="h-12 bg-base-200 rounded animate-pulse" />
              <div className="h-12 bg-base-200 rounded animate-pulse" />
              <div className="h-12 bg-base-200 rounded animate-pulse" />
            </div>
          </div>
        </Card>
      </MotionFadeIn>
    );
  }

  return (
    <MotionFadeIn>
      <Card className="rounded-lg shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

          {editing ? (
            <div className="space-y-4">
              <Input
                name="name"
                value={formData.name}
                onChange={onChange}
                placeholder="Full name"
              />
              <Input
                name="email"
                value={formData.email}
                onChange={onChange}
                placeholder="Email"
              />
              <Input
                name="phone"
                value={formData.phone}
                onChange={onChange}
                placeholder="Phone number"
              />
              <div>
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  className="textarea textarea-bordered w-full h-24"
                />
              </div>

              <h3 className="text-lg font-medium mt-4">Bank & Nominee</h3>
              <Input
                name="bankName"
                value={formData.bankName}
                onChange={onChange}
                placeholder="Bank name"
              />
              <Input
                name="accountMasked"
                value={formData.accountMasked}
                onChange={onChange}
                placeholder="Account (masked)"
              />
              <Input
                name="ifsc"
                value={formData.ifsc}
                onChange={onChange}
                placeholder="IFSC"
              />
              <Input
                name="nominee"
                value={formData.nominee}
                onChange={onChange}
                placeholder="Nominee name"
              />
              <Input
                name="nomineeContact"
                value={formData.nomineeContact}
                onChange={onChange}
                placeholder="Nominee contact"
              />

              <h3 className="text-lg font-medium mt-4">Employment & Income</h3>
              <Input
                name="employment"
                value={formData.employment}
                onChange={onChange}
                placeholder="Employer / Job title"
              />
              <Input
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={onChange}
                placeholder="Monthly income"
              />

              <div className="flex gap-3 mt-3">
                <Button
                  variant="gradient"
                  onClick={onSave}
                  disabled={saving}
                  style={{
                    backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                    color: "white",
                  }}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onSave && onSave("cancel")}
                  disabled={saving}>
                  Cancel
                </Button>
                {/* approval button - optional */}
                {onApprove && (
                  <Button
                    variant="outline"
                    onClick={onApprove}
                    disabled={saving}>
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Full Name
                  </Text>
                  <div className="font-medium mt-1">{formData.name || "—"}</div>
                </div>
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Email
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.email || "—"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Phone
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.phone || "—"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Address
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.address || "—"}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-2">Bank & Nominee</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Bank
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.bankName || "—"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Account
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.accountMasked || "—"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    IFSC
                  </Text>
                  <div className="font-medium mt-1">{formData.ifsc || "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Nominee
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.nominee || "—"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Nominee Contact
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.nomineeContact || "—"}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-2">Employment & Income</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Employer / Role
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.employment || "—"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-base-200/50">
                  <Text variant="muted" className="text-xs">
                    Monthly Income
                  </Text>
                  <div className="font-medium mt-1">
                    {formData.monthlyIncome || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </MotionFadeIn>
  );
}
