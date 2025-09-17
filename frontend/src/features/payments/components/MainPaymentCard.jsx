import React from "react";
import { Card } from "@components/ui/Card.jsx";
import { Button } from "@components/ui/Button.jsx";
import { CreditCard, CalendarDays, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { Text } from "@components/ui/Text.jsx";

export default function MainPaymentCard({
  loading,
  dues,
  onDownloadLastReceipt,
  onPay,
  result,
  canPay = true,
  isCompleted = false,
  totalPaid = 0,
  completionDate = null,
}) {
  const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);
  if (loading)
    return (
      <Card className="p-6 rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-base-200 rounded" />
          <div className="h-12 bg-base-200 rounded" />
        </div>
      </Card>
    );

  // If loan is completed, show completion message
  if (isCompleted) {
    return (
      <Card className="p-6 rounded-lg shadow-md border-green-200 bg-green-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Loan Completed! 🎉</h2>
          <Text variant="muted" className="mb-4">
            Congratulations! You have successfully completed all payments for this loan.
          </Text>

          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Total Amount Paid:</span>
                <div className="text-lg font-bold text-green-600">₹{inr(totalPaid)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Completion Date:</span>
                <div className="text-lg font-bold text-green-600">
                  {completionDate
                    ? new Date(completionDate).toLocaleDateString("en-IN")
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Current Payment</h2>
          <Text variant="muted" className="mt-1">
            Pay your current outstanding amount securely.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownloadLastReceipt(dues.lastPayment)}>
            <FileText className="w-4 h-4" /> Download Last Receipt (PDF)
          </Button>

          <Button
            variant="gradient"
            size="lg"
            onClick={() => onPay()}
            disabled={!canPay}
            style={{
              backgroundImage: canPay ? "linear-gradient(90deg,#84cc16,#22c55e)" : "linear-gradient(90deg,#9ca3af,#6b7280)",
              color: "white",
              opacity: canPay ? 1 : 0.6,
            }}>
            <CreditCard className="w-4 h-4" />
            {canPay ? `Pay ₹${inr(dues.totalDue)} Now` : "Loading payment details..."}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="alert alert-info">
          <CreditCard className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Amount Due: ₹{inr(dues.totalDue)}</h3>
            <div className="text-sm opacity-75">
              Outstanding balance on your loan.
            </div>
          </div>
        </div>
        <div className={`alert ${dues.isOverdue ? "alert-error" : "alert-warning"}`}>
          <CalendarDays className="w-5 h-5" />
          <div>
            <h3 className="font-bold">
              Due Date:{" "}
              {dues.dueDate
                ? new Date(dues.dueDate).toLocaleDateString("en-IN")
                : "-"}
            </h3>
            <div className="text-sm opacity-75">
              {dues.isOverdue ? (
                <div>
                  <div className="font-semibold text-red-600">OVERDUE - Penalty Applied!</div>
                  <div>Original Amount: ₹{inr(dues.originalAmount || dues.totalDue)}</div>
                  <div>Penalty (2%): ₹{inr(dues.penaltyAmount || 0)}</div>
                  <div className="font-bold">Total Due: ₹{inr(dues.totalDue)}</div>
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    Please pay by the due date to avoid late fees of <span className="font-bold text-lg">₹{inr(Math.round((dues.originalAmount || dues.totalDue) * 0.02))}</span>.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="alert">
          <CheckCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Last Payment: {dues.lastPayment.date}</h3>
            <div className="text-sm opacity-75">
              Amount: ₹{inr(dues.lastPayment.amount)} • Method:{" "}
              {dues.lastPayment.method} • Ref: {dues.lastPayment.ref}
            </div>
          </div>
        </div>

        {result && (
          <div
            className={`alert mt-4 ${
              result.ok ? "alert-success" : "alert-error"
            }`}>
            {result.ok ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium ml-2">{result.message}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
