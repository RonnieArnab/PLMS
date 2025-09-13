import React from "react";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Text } from "@components/ui/Text.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Badge } from "@components/ui/Badge.jsx";
import { Eye, Download, CreditCard, CheckCircle2 } from "lucide-react";
import { inr } from "@features/loans/utils/myloansUtils";

export default function LoanCard({
  loan,
  index = 0,
  onView = () => {},
  onDownload = () => {},
  onPay = () => {},
  loading = false,
}) {
  if (loading) {
    return (
      <MotionFadeIn delay={index * 0.04}>
        <Card className="rounded-lg shadow-md">
          <div className="p-6 space-y-4">
            <div className="h-6 w-3/4 bg-base-200 rounded animate-pulse" />
            <div className="flex items-center gap-4 text-base-content/60">
              <div className="h-4 w-20 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-base-200 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <div className="h-12 bg-base-200 rounded animate-pulse" />
              <div className="h-12 bg-base-200 rounded animate-pulse" />
              <div className="h-12 bg-base-200 rounded animate-pulse" />
              <div className="h-12 bg-base-200 rounded animate-pulse" />
            </div>

            <div className="h-8 w-40 bg-base-200 rounded animate-pulse mt-4" />
          </div>
        </Card>
      </MotionFadeIn>
    );
  }

  const progress = loan.amount
    ? Math.round((loan.totalRepaid / loan.amount) * 100)
    : 0;
  const statusMap = {
    active: "success",
    completed: "info",
    pending: "warning",
  };

  return (
    <MotionFadeIn delay={index * 0.06}>
      <Card className="rounded-lg shadow-md hover:shadow-lg transition-all">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">{loan.purpose}</h3>
              <div className="flex items-center gap-4 text-base-content/60">
                <span className="text-sm">Loan ID: {loan.id}</span>
                {loan.disbursedAt && (
                  <>
                    <div className="divider divider-horizontal" />
                    <span className="text-sm">
                      Disbursed:{" "}
                      {new Date(loan.disbursedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
                <Badge
                  variant={statusMap[loan.status] || "ghost"}
                  size="sm"
                  className="ml-2">
                  {loan.status}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onView(loan)}
                aria-label={`View ${loan.purpose}`}>
                <Eye className="w-4 h-4" /> Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onDownload(loan)}
                aria-label={`Download statement ${loan.purpose}`}>
                <Download className="w-4 h-4" /> Statement
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-base-200/50 p-3 rounded-md">
              <Text variant="muted" className="text-xs">
                Loan Amount
              </Text>
              <div className="font-semibold mt-1">₹{inr(loan.amount)}</div>
            </div>

            <div className="bg-base-200/50 p-3 rounded-md">
              <Text variant="muted" className="text-xs">
                Interest Rate
              </Text>
              <div className="font-semibold mt-1">{loan.interestRate}% APR</div>
            </div>

            <div className="bg-base-200/50 p-3 rounded-md">
              <Text variant="muted" className="text-xs">
                Monthly Payment
              </Text>
              <div className="font-semibold mt-1">
                ₹{inr(loan.monthlyPayment)}
              </div>
            </div>

            <div className="bg-base-200/50 p-3 rounded-md">
              <Text variant="muted" className="text-xs">
                {loan.status === "active" ? "Remaining Balance" : "Total Paid"}
              </Text>
              <div className="font-semibold mt-1">
                ₹
                {loan.status === "active"
                  ? inr(loan.remainingBalance)
                  : inr(loan.totalRepaid)}
              </div>
            </div>
          </div>

          {loan.status === "active" && (
            <>
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <Text variant="muted" className="text-sm">
                    Repayment Progress
                  </Text>
                  <div className="font-semibold">{progress}%</div>
                </div>
                <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-lime-400"
                    style={{
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                <div>
                  <Text variant="muted" className="text-sm">
                    Next Payment Due
                  </Text>
                  <div className="font-semibold">
                    {loan.nextPaymentDate
                      ? new Date(loan.nextPaymentDate).toLocaleDateString()
                      : "-"}{" "}
                    • ₹{inr(loan.monthlyPayment)}
                  </div>
                </div>

                <div>
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => onPay(loan)}
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #84cc16, #22c55e)",
                      color: "white",
                    }}>
                    <CreditCard className="w-4 h-4" /> Make Payment
                  </Button>
                </div>
              </div>
            </>
          )}

          {loan.status === "completed" && loan.completedAt && (
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <div className="font-semibold">
                  Loan completed on{" "}
                  {new Date(loan.completedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </MotionFadeIn>
  );
}
