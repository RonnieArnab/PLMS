import React, { useState } from "react";
import { Button } from "@components/ui/Button.jsx";
import { X } from "lucide-react";
import PaymentSuccessModal from "./PaymentSuccessModal.jsx";
import { PaymentsService } from "@services/paymentService";

export default function PaymentModal({ open, onClose, amount, onSuccess, userId, loanId, onDownload }) {
  const [isAutopay, setIsAutopay] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);

  if (!open) return null;

  // Validate required props
  if (!userId) {
    console.error('PaymentModal: userId is required but not provided');
    alert('User authentication required. Please log in again.');
    onClose();
    return null;
  }

  console.log('PaymentModal initialized with:', { userId, loanId, amount });

  async function startPayment() {
    setProcessing(true);

    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      console.error("Razorpay SDK not loaded");
      alert("Razorpay SDK not loaded. Please refresh the page and try again.");
      setProcessing(false);
      return;
    }

    console.log("Starting payment process...");

    if (!isAutopay) {
      // Hit backend to create order
      try {
        const order = await PaymentsService.createOrder(amount);

        const options = {
        key: "rzp_test_RIBPU0g2WXd7q9",
        amount: order.amount,
        currency: order.currency,
        name: "Loan Management System",
        description: "One-time EMI Payment",
        order_id: order.id,
        theme: {
          color: "#528FF0"
        },
        modal: {
          escape: true,
          animation: true,
          confirm_close: false,
          backdropclose: true,
          ondismiss: function() {
            setProcessing(false);
          }
        },
        method: {
          netbanking: 1,
          card: 1,
          upi: 1,
          wallet: 0
        },
        handler: async function (response) {
          try {
            console.log('Razorpay checkout response:', response);
            console.log('loanId:', loanId, 'userId:', userId);

            // Verify payment on backend and get details
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              loan_id: loanId,
              payer_user_id: userId
            };

            console.log('Sending to verify endpoint:', verifyPayload);

            const data = await PaymentsService.verifyPayment(verifyPayload);
            console.log('Verification response:', data);

            if (data.ok) {
              console.log('Payment verified and recorded successfully:', data.payment);
              const paymentData = {
                ...data.payment,
                method: data.payment.payment_method,
                date: data.payment.payment_date,
                amount: data.payment.amount_paid,
                transaction_ref: data.payment.transaction_reference
              };
              setCompletedPayment(paymentData);
              setShowSuccess(true);
              onSuccess(paymentData);
            } else {
              console.error('Payment verification failed:', data);
              alert(`Payment verification failed: ${data.msg || 'Unknown error'}`);
            }
          } catch (error) {
            console.error("Error processing payment:", error);
            alert(`Payment processing failed: ${error.message}`);
          }
          setProcessing(false);
          onClose();
        }
      };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setProcessing(false);
      } catch (error) {
        console.error("Error creating order:", error);
        alert("Failed to create payment order. Please try again.");
        setProcessing(false);
        return;
      }
    } else {
      // Autopay: create subscription
      try {
        const sub = await PaymentsService.createSubscription("plan_J7Hxxxxxx");

        const options = {
        key: "rzp_test_RIBPU0g2WXd7q9",
        subscription_id: sub.id,
        name: "Loan Management System",
        description: "Autopay Subscription",
        theme: {
          color: "#528FF0"
        },
        modal: {
          escape: true,
          animation: true,
          confirm_close: false,
          backdropclose: true,
          ondismiss: function() {
            setProcessing(false);
          }
        },
        method: {
          netbanking: 1,
          card: 1,
          upi: 1,
          wallet: 0
        },
        handler: async function (response) {
          try {
            // Record payment in database
            const paymentData = await PaymentsService.makePayment({
              user_id: userId,
              loan_id: loanId,
              amount,
              payment_method: "Razorpay Autopay",
              transaction_ref: response.razorpay_payment_id
            });

            if (paymentData) {
              const paymentData = {
                id: response.razorpay_payment_id,
                date: new Date().toISOString(),
                amount,
                method: "Autopay",
                transaction_ref: response.razorpay_payment_id
              };
              setCompletedPayment(paymentData);
              setShowSuccess(true);
              onSuccess(paymentData);
            }
          } catch (error) {
            console.error("Error recording autopay:", error);
          }
          onClose();
        }
      };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setProcessing(false);
      } catch (error) {
        console.error("Error creating subscription:", error);
        alert("Failed to create autopay subscription. Please try again.");
        setProcessing(false);
        return;
      }
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold mb-4">Complete Payment</h3>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAutopay}
              onChange={(e) => setIsAutopay(e.target.checked)}
              className="mr-2"
            />
            Enable Autopay (Recurring)
          </label>
        </div>

        <Button
          variant="gradient"
          disabled={processing}
          onClick={startPayment}
          style={{
            backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
            color: "white",
          }}
        >
          {processing ? "Processing..." : `Pay ₹${amount}`}
        </Button>
      </div>

      {/* Success Modal */}
      <PaymentSuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setCompletedPayment(null);
          onClose();
        }}
        payment={completedPayment}
        onDownload={onDownload}
      />
    </div>
  );
}
