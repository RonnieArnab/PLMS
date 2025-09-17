import React from "react";
import { Button } from "@components/ui/Button.jsx";
import { X, CheckCircle, Download, FileText } from "lucide-react";

export default function PaymentSuccessModal({ open, onClose, payment, onDownload }) {
  if (!open || !payment) return null;

  const formatAmount = (amount) => `₹${(amount || 0).toLocaleString("en-IN")}`;
  const formatDate = (date) => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success header */}
        <div className="bg-green-50 p-6 rounded-t-xl">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
            Payment Successful! 🎉
          </h2>
          <p className="text-center text-gray-600 text-sm">
            Your payment has been processed successfully
          </p>
        </div>

        {/* Payment details */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Amount Paid:</span>
              <span className="text-lg font-bold text-green-600">
                {formatAmount(payment.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Payment Method:</span>
              <span className="text-sm font-medium">
                {payment.method || "Razorpay"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Transaction ID:</span>
              <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                {payment.transaction_ref || payment.id}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Date & Time:</span>
              <span className="text-sm">
                {formatDate(payment.date || payment.payment_date)}
              </span>
            </div>

            {payment.loan_id && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Loan ID:</span>
                <span className="text-sm font-medium">
                  {payment.loan_id}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                onDownload(payment);
                onClose();
              }}
              className="flex-1 gap-2"
              style={{
                backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                color: "white",
              }}
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Receipt has been saved to your payment history
          </p>
        </div>
      </div>
    </div>
  );
}
