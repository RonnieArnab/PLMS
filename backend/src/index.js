import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import userRoutes from "./routes/users.js";
import customerRoutes from "./routes/customers.js";
import bankRoutes from "./routes/bankAccounts.js";
import loanProductRoutes from "./routes/loanProducts.js";
import loanAppRoutes from "./routes/loanApplications.js";
import documentRoutes from "./routes/documents.js";
import repaymentRoutes from "./routes/repayments.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";
import kycRoutes from "./routes/kyc.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bank-accounts", bankRoutes);
app.use("/api/loan-products", loanProductRoutes);
app.use("/api/loan-applications", loanAppRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/repayments", repaymentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/kyc", kycRoutes);

app.get("/", (req, res) => res.send("Loan Management API running 🚀"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
