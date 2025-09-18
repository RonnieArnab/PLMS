// src/features/profile/components/KycCard.jsx
import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { Button } from "@components/ui/Button.jsx";

function StatusBadge({ status }) {
  const s = String(status ?? "").toUpperCase();
  if (s === "VERIFIED" || s === "AUTO_APPROVED")
    return <Badge variant="success">Verified</Badge>;
  if (s === "PENDING") return <Badge variant="warning">Pending</Badge>;
  if (s === "NEEDS_REVIEW")
    return <Badge variant="warning">Needs review</Badge>;
  if (s === "REJECTED") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="secondary">Not submitted</Badge>;
}

export default function KycCard({ loading, kyc = {}, onUpdate }) {
  return (
    <MotionFadeIn>
      <Card className="rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">KYC Status</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-48 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-base-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aadhaar eKYC</span>
                  <StatusBadge status={kyc.aadhaar_status} />
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onUpdate}>
                  Update KYC
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </MotionFadeIn>
  );
}
