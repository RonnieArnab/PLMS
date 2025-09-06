import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { Eye, ArrowUpRight } from "lucide-react";
import { formatINR } from "@features/dashboard/components/currency";

const getStatusBadge = (status) => {
  const map = {
    approved: "success",
    "under-review": "warning",
    pending: "info",
    rejected: "error",
  };
  return map[status] || "ghost";
};

export default function ApplicationsTable({ applications = [] }) {
  return (
    <MotionFadeIn>
      <Card className="p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Loan Applications</h2>
          <Button variant="outline" size="sm" className="gap-2">
            View All
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm text-base-content/60">
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Purpose</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Submitted</th>
                <th className="text-left py-2">Interest</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(applications || []).map((app) => (
                <tr
                  key={app.id}
                  className="border-t hover:bg-base-200/40 transition-colors">
                  <td className="py-4 font-semibold">
                    {formatINR(app.amount)}
                  </td>
                  <td className="py-4">{app.purpose}</td>
                  <td className="py-4">
                    <Badge variant={getStatusBadge(app.status)} size="sm">
                      {app.status.replace("-", " ")}
                    </Badge>
                  </td>
                  <td className="py-4 text-sm text-base-content/60">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td className="py-4">
                    {app.interestRate != null ? `${app.interestRate}%` : "-"}
                  </td>
                  <td className="py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log("view", app.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(!applications || applications.length === 0) && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-6 text-center text-base-content/60">
                    No recent applications
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </MotionFadeIn>
  );
}
