import React from "react";
import { Card } from "@components/ui/Card.jsx";
import { Text } from "@components/ui/Text.jsx";
import { DollarSign, CalendarDays, TrendingUp } from "lucide-react";

export default function KpiCards({ loading, dues, totalPaid }) {
  const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);
  if (loading)
    return (
      <>
        <Card className="p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-8 w-full bg-base-200" />
        </Card>
        <Card className="p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-8 w-full bg-base-200" />
        </Card>
        <Card className="p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-8 w-full bg-base-200" />
        </Card>
      </>
    );

  return (
    <>
      <Card className="p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-lime-50 text-lime-600 p-3 rounded-lg inline-flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <Text variant="muted" className="text-sm">
              Amount Due
            </Text>
            <div className="text-2xl font-semibold">₹{inr(dues?.totalDue)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-lime-50 text-lime-600 p-3 rounded-lg inline-flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <Text variant="muted" className="text-sm">
              Due Date
            </Text>
            <div className="text-2xl font-semibold">
              {dues?.dueDate
                ? new Date(dues.dueDate).toLocaleDateString("en-IN")
                : "-"}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-lime-50 text-lime-600 p-3 rounded-lg inline-flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <Text variant="muted" className="text-sm">
              Total Paid
            </Text>
            <div className="text-2xl font-semibold">₹{inr(totalPaid)}</div>
          </div>
        </div>
      </Card>
    </>
  );
}
