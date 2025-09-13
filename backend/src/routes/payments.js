import { Router } from "express";
import * as controller from "../controllers/payments.js";
import { validatePaymentCreate } from "../middleware/paymentValidators.js";

const router = Router();

// Example endpoints
router.get("/", controller.getAll);
// Payments for a specific user
router.get("/user/:user_id", controller.getByUser);
// Payments for a specific loan
router.get("/loan/:loan_id", controller.getByLoan);
router.post("/", validatePaymentCreate, controller.create);

export default router;
