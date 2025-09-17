import express from "express";
import * as controller from "../controllers/dashboard.js";

const router = express.Router();

// Dashboard routes
router.get("/stats", controller.getDashboardStats);
router.get("/applications", controller.getLoanApplications);
router.get("/payments", controller.getPaymentHistory);
router.get("/portfolio", controller.getPortfolioBreakdown);

export default router;
