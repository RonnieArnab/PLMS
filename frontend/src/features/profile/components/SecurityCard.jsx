import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Shield } from "lucide-react";
import { Badge } from "@components/ui/Badge.jsx";
import { Button } from "@components/ui/Button.jsx";

export default function SecurityCard({ loading, security = {}, onManage }) {
  return (
    <MotionFadeIn>
      <Card className="rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Security</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-48 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-base-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Two-Factor Auth</span>
                  <Badge variant="success" size="sm">
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Verified</span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phone Verified</span>
                  <Badge variant="warning" size="sm">
                    Pending
                  </Badge>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onManage}>
                  Manage Security
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </MotionFadeIn>
  );
}
