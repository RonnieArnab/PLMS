import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";

export default function QuickActions({
  onExport,
  onDownloadVCard,
  onDelete,
  disabled,
}) {
  return (
    <MotionFadeIn>
      <Card className="rounded-lg shadow-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={onExport}
              disabled={disabled}>
              Export Data
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onDownloadVCard}
              disabled={disabled}>
              Download Profile
            </Button>
            <Button
              variant="outline"
              className="w-full btn-error"
              onClick={onDelete}
              disabled={disabled}>
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </MotionFadeIn>
  );
}
