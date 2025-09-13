import express from "express";
import {
  createAdmin,
  listCustomers,
  getCustomerById,
} from "../controllers/auth.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/create", authenticate, requireAdmin, createAdmin);
router.get("/customers", authenticate, requireAdmin, listCustomers);
router.get(
  "/customers/:customerId",
  authenticate,
  requireAdmin,
  getCustomerById
);

export default router;
