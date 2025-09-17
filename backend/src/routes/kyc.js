// src/routes/kyc.js
import { Router } from "express";
import * as controller from "../controllers/kyc.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * POST /api/kyc/aadhaar
 * - Accepts multipart/form-data with field: aadhaar_file (PDF or image)
 * - Optional: aadhaar_pdf_passcode
 */
router.post(
  "/aadhaar",
  authenticate,
  controller.upload.single("aadhaar_file"),
  controller.verifyAadhaar
);

/**
 * GET /api/kyc/status
 * - Returns the user's current Aadhaar KYC status snapshot.
 */
router.get("/status", authenticate, controller.getKycStatusForCurrentUser);

export default router;
