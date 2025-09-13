import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@components/ui/Button.jsx";
import { Input } from "@components/ui/Input.jsx";

export default function PaymentModal({ open, onClose, amount, onSuccess }) {
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("");

  useEffect(() => {
    if (!open) {
      setMethod("card");
      setProcessing(false);
      setError(null);
      setCardNumber("");
      setUpiId("");
      setBank("");
    }
  }, [open]);

  const simulateNetwork = (ms = 1200) =>
    new Promise((res) => setTimeout(res, ms));

  async function handleStripeCardPayment() {
    await simulateNetwork();
    return {
      ok: true,
      id: `stripe_${Date.now()}`,
      method: "Card",
      ref: "STRP123",
    };
  }
  async function handleRazorpayUpiPayment() {
    await simulateNetwork();
    return { ok: true, id: `rzp_${Date.now()}`, method: "UPI", ref: "RZP123" };
  }
  async function handleNetbankingPayment() {
    await simulateNetwork();
    return {
      ok: true,
      id: `nb_${Date.now()}`,
      method: "Netbanking",
      ref: "NBK123",
    };
  }

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    try {
      let result;
      if (method === "card") {
        if (!cardNumber || cardNumber.length < 12)
          throw new Error("Enter a valid card number (demo validation).");
        result = await handleStripeCardPayment();
      } else if (method === "upi") {
        if (!upiId || !upiId.includes("@"))
          throw new Error("Enter a valid UPI ID (e.g. name@bank).");
        result = await handleRazorpayUpiPayment();
      } else {
        if (!bank) throw new Error("Select your bank for netbanking.");
        result = await handleNetbankingPayment();
      }
      if (!result.ok) throw new Error(result.message || "Payment failed");
      const payment = {
        id: result.id,
        date: new Date().toISOString().slice(0, 10),
        amount,
        method: result.method,
        ref: result.ref,
        payer: { name: "Arnab Ghosh", email: "arnab@example.com" },
      };
      onSuccess(payment);
      setProcessing(false);
      onClose();
    } catch (err) {
      setProcessing(false);
      setError(err.message || "Payment failed");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !processing && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Complete Payment</h3>
            <p className="text-sm text-base-content/60">
              Pay ₹
              {typeof amount === "number"
                ? amount.toLocaleString("en-IN")
                : amount}{" "}
              using your preferred method
            </p>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => !processing && onClose()}>
            Close
          </button>
        </div>

        <div className="mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("card")}
              className={`btn btn-sm ${
                method === "card" ? "btn-active" : "btn-ghost"
              }`}>
              Card
            </button>
            <button
              onClick={() => setMethod("upi")}
              className={`btn btn-sm ${
                method === "upi" ? "btn-active" : "btn-ghost"
              }`}>
              UPI
            </button>
            <button
              onClick={() => setMethod("netbanking")}
              className={`btn btn-sm ${
                method === "netbanking" ? "btn-active" : "btn-ghost"
              }`}>
              Netbanking
            </button>
          </div>

          <div className="mt-4">
            {method === "card" && (
              <div className="space-y-3">
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card number (demo)"
                />
                <div className="flex gap-2">
                  <Input placeholder="MM/YY" className="flex-1" />
                  <Input placeholder="CVC" className="w-24" />
                </div>
              </div>
            )}

            {method === "upi" && (
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@bank (UPI ID)"
              />
            )}

            {method === "netbanking" && (
              <div>
                <select className="select w-full">
                  <option value="">Select bank (demo)</option>
                  <option value="hdfc">HDFC</option>
                  <option value="sbi">SBI</option>
                  <option value="axis">Axis</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            {error && <div className="text-sm text-error mb-2">{error}</div>}
            <div className="text-sm text-base-content/60">
              Secure payment — card details are not stored.
            </div>
          </div>
          <div>
            <Button
              variant="gradient"
              onClick={handlePay}
              disabled={processing}
              style={{
                backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                color: "white",
              }}>
              {processing
                ? "Processing..."
                : `Pay ₹${
                    typeof amount === "number"
                      ? amount.toLocaleString("en-IN")
                      : amount
                  }`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
