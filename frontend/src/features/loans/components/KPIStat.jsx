import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Text } from "@components/ui/Text.jsx";

export default function KPIStat({ icon: Icon, label, value, loading = false }) {
  return (
    <MotionFadeIn>
      <Card className="p-4 rounded-lg shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className="bg-lime-50 text-lime-600 p-3 rounded-lg inline-flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <Text variant="muted" className="text-sm">
              {label}
            </Text>
            <div className="mt-1">
              {loading ? (
                <div className="h-6 w-28 bg-base-200 rounded animate-pulse" />
              ) : (
                <Text className="text-2xl font-semibold">{value}</Text>
              )}
            </div>
          </div>
        </div>
      </Card>
    </MotionFadeIn>
  );
}
