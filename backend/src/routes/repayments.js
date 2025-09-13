import { Router } from "express";
import * as controller from "../controllers/repayments.js";
import { validateRepaymentCreate } from "../middleware/paymentValidators.js";

const router = Router();

// Example endpoints
router.get("/", controller.getAll);
// Repayment schedule for a specific user
router.get("/user/:user_id", controller.getByUser);
// Repayment schedule for a specific loan
router.get("/loan/:loan_id", controller.getByLoan);
router.post("/", validateRepaymentCreate, controller.create);

export default router;
