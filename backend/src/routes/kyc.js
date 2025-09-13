// src/routes/kyc.js
import { Router } from "express";
import * as controller from "../controllers/kyc.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Aadhaar route
 * Accepts either:
 *  - aadhaar_zip (offline paperless ZIP)
 *  - aadhaar_file (PDF)
 * Optional form fields:
 *  - aadhaar_passcode (for ZIP)
 *  - aadhaar_pdf_passcode (for PDF)
 *  - aadhaar_no (12-digit number)
 */
router.post(
  "/aadhaar",
  authenticate,
  // controller.upload should be exported from controllers/kyc.js (multer instance)
  controller.upload.fields([
    { name: "aadhaar_zip", maxCount: 1 },
    { name: "aadhaar_file", maxCount: 1 },
  ]),
  controller.verifyAadhaar
);

/**
 * PAN route
 * Accepts:
 *  - pan_file (PDF or image)
 * Optional form fields:
 *  - pan_pdf_passcode
 *  - pan_no
 */
router.post(
  "/pan",
  authenticate,
  controller.upload.fields([{ name: "pan_file", maxCount: 1 }]),
  controller.verifyPan
);

/**
 * Combined documents route (optional)
 * Accepts any of the above files in one request.
 * The controller currently provides verifyDocuments which returns 501 by default.
 */
router.post(
  "/documents",
  authenticate,
  controller.upload.fields([
    { name: "aadhaar_zip", maxCount: 1 },
    { name: "aadhaar_file", maxCount: 1 },
    { name: "pan_file", maxCount: 1 },
  ]),
  // defensive: if controller.verifyDocuments exists use it, otherwise a stub handler
  typeof controller.verifyDocuments === "function"
    ? controller.verifyDocuments
    : (_req, res) =>
        res.status(501).json({ ok: false, error: "Not implemented" })
);

/**
 * GET /api/kyc/latest
 * Return latest KYC records for current user (both AADHAAR and PAN when present)
 *
 * Controller side: preferred exported function names:
 *  - getLatestKycForUserHandler(req,res)  (recommended)
 *  - getLatestKycForUser(userId)          (utility)
 *
 * We try to call the handler if present; otherwise we call the utility and wrap the response.
 */
if (typeof controller.getLatestKycForUserHandler === "function") {
  router.get("/latest", authenticate, controller.getLatestKycForUserHandler);
} else if (typeof controller.getLatestKycForUser === "function") {
  // wrap the utility into an express handler
  router.get("/latest", authenticate, async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId)
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      const latest = await controller.getLatestKycForUser(userId);
      return res.json({ ok: true, latest });
    } catch (err) {
      console.error("GET /api/kyc/latest error:", err);
      return res
        .status(500)
        .json({
          ok: false,
          error: "Failed to fetch latest KYC",
          details: String(err?.message || err),
        });
    }
  });
} else {
  // neither exported — provide a safe 501 endpoint
  router.get("/latest", authenticate, (_req, res) =>
    res
      .status(501)
      .json({
        ok: false,
        error: "KYC latest endpoint not implemented on server",
      })
  );
}

/**
 * Admin: POST /api/kyc/records/:id/request-review
 * Request manual review of a particular kyc_records.id
 *
 * Controller should implement `requestReview(req,res)` which accepts req.params.id
 * and performs the necessary admin actions (set reviewer, change status, add notes).
 * If not present we return 501 so the route exists but signals not implemented.
 */
if (typeof controller.requestReview === "function") {
  router.post(
    "/records/:id/request-review",
    authenticate,
    requireAdmin,
    controller.requestReview
  );
} else {
  router.post(
    "/records/:id/request-review",
    authenticate,
    requireAdmin,
    (req, res) =>
      res
        .status(501)
        .json({ ok: false, error: "requestReview not implemented on server" })
  );
}

/**
 * Secure XML download route.
 * Only the owner (uploader) or an ADMIN can download XML artifacts.
 * Client must call with authentication header (so req.user is set).
 *
 * Controller must export downloadXml(req,res).
 */
router.get("/download-xml/:fileId", authenticate, (req, res, next) => {
  if (typeof controller.downloadXml === "function")
    return controller.downloadXml(req, res, next);
  return res
    .status(501)
    .json({ ok: false, error: "downloadXml not implemented on server" });
});

export default router;
