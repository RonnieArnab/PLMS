import { Router } from "express";
import * as controller from "../controllers/kyc.js";

const router = Router();

router.post("/aadhaar", controller.verifyAadhaar);
router.post("/pan", controller.verifyPan);
router.post("/documents", controller.verifyDocuments);

export default router;
