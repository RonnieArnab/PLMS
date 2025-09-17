import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { formatINR } from "@features/dashboard/components/currency";
import { useNavigate } from "react-router-dom";

const getStatusBadge = (status) => {
  const map = {
    approved: "success",
    "under-review": "warning",
    "under_review": "warning",
    pending: "info",
    rejected: "error",
    draft: "ghost",
  };
  return map[status] || "ghost";
};

export default function ApplicationsTable({ applications = [] }) {
    const navigate = useNavigate();
  return (
    <MotionFadeIn>
      <Card className="p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Active Loan </h2>
          <Button  onClick={() => navigate("/loans")}  variant="outline" size="sm" className="gap-2">
            View All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-sm text-base-content/60">
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Loan Name</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Approved Date</th>
                <th className="text-left py-2">Interest</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(applications) && applications.length > 0 ? (
                applications.map((app) => {
                  const id = app.id ?? app.loan_id;
                  const amount = Number(app.amount ?? app.loan_amount ?? 0);
                  const loanName = app.purpose ?? app.product_name ?? "-";
                  const status = (app.status ?? app.application_status ?? "").toLowerCase();
                  const approvedAtTs =
                    app.submittedAt ??
                    (app.approved_date ? new Date(app.approved_date).getTime() : null);
                  const interest =
                    app.interestRate != null
                      ? app.interestRate
                      : app.interest_rate_apr
                      ? parseFloat(app.interest_rate_apr)
                      : null;

                  return (
                    <tr key={id} className="border-t hover:bg-base-200/40 transition-colors">
                      <td className="py-4 font-semibold">{formatINR(amount)}</td>
                      <td className="py-4">{loanName}</td>
                      <td className="py-4">
                        <Badge variant={getStatusBadge(status)} size="sm">
                          {status ? status.replace(/[-_]/g, " ") : "-"}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-base-content/60">
                        {approvedAtTs ? new Date(approvedAtTs).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="py-4">{interest != null ? `${interest}%` : "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-base-content/60">
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
