import { Router } from "express";
import * as controller from "../controllers/repayments.js";
import { validateRepaymentCreate } from "../middleware/paymentValidators.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Repayment routes (require authentication)
router.get("/", authenticate, controller.getAll);
// Repayment schedule for a specific user
router.get("/user/:user_id", authenticate, controller.getByUser);
// Repayment schedule for a specific loan
router.get("/loan/:loan_id", authenticate, controller.getByLoan);
// Next upcoming repayment for a specific loan
router.get("/next/:loan_id", authenticate, controller.getNext);
router.post("/", authenticate, validateRepaymentCreate, controller.create);

export default router;
