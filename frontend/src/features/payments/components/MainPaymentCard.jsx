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
            style={{
              backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
              color: "white",
            }}>
            <CreditCard className="w-4 h-4" /> Pay ₹{inr(dues.totalDue)} Now
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
        <div className="alert alert-warning">
          <CalendarDays className="w-5 h-5" />
          <div>
            <h3 className="font-bold">
              Due Date:{" "}
              {dues.dueDate
                ? new Date(dues.dueDate).toLocaleDateString("en-IN")
                : "-"}
            </h3>
            <div className="text-sm opacity-75">
              Please pay by the due date to avoid late fees.
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
