import express from "express";
import { registerCustomer } from "../controllers/auth.js"; // adjust path if needed
import {
  completeCustomerProfile,
  getCustomerMe,
  patchCustomerMe,
  kycUpload,
  postCustomerKyc,
} from "../controllers/customerController.js"; // optional
import { authenticate } from "../middleware/authMiddleware.js"; // optional if used

const router = express.Router();

// debug route (useful to confirm router mounting)
router.get("/ping", (req, res) =>
  res.json({ ok: true, route: "/api/customer/ping" })
);

// POST /api/customer/register  --> create user + profile in one shot
router.post("/register", registerCustomer);

router.get("/me", authenticate, getCustomerMe);

router.patch("/me", authenticate, patchCustomerMe);

router.post("/complete", authenticate, completeCustomerProfile);

// KYC multipart
router.post(
  "/kyc",
  authenticate,
  kycUpload.fields([
    { name: "pan_file", maxCount: 1 },
    { name: "aadhaar_file", maxCount: 1 },
  ]),
  postCustomerKyc
);

export default router;
