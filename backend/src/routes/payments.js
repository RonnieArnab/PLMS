import express from "express";
import {
  getPaymentsByUser,
  getPaymentsByLoan,
  recordPayment,
  createOrder,
  createSubscription,
  verifyPayment,
  verifySubscription,
  getPaymentHistory,
  exportPaymentStatements
} from "../controllers/payments.js";

const router = express.Router();

// Get payments
router.get("/user/:userId", getPaymentsByUser);
router.get("/loan/:loanId", getPaymentsByLoan);
router.get("/history", getPaymentHistory);

// Export payment statements to Excel
router.get("/export/:userId", exportPaymentStatements);

// Record payment
router.post("/", recordPayment);

// Razorpay integration
router.post("/order", createOrder);
router.post("/subscription", createSubscription);
router.post("/verify", verifyPayment);
router.post("/verify-subscription", verifySubscription);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Payments API is working", timestamp: new Date().toISOString() });
});

export default router;
