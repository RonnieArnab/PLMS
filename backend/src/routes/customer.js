import express from "express";
import { registerCustomer } from "../controllers/auth.js";
import {
  completeCustomerProfile,
  getCustomerMe,
  patchCustomerMe,
  kycUpload,
  postCustomerKyc,
} from "../controllers/customerController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/ping", (req, res) =>
  res.json({ ok: true, route: "/api/customer/ping" })
);

router.post("/register", registerCustomer);

router.get("/me", authenticate, getCustomerMe);

router.patch("/me", authenticate, patchCustomerMe);

router.post(
  "/complete",
  authenticate,
  completeCustomerProfile
);

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
