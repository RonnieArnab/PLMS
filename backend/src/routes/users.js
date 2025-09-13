import { Router } from "express";
import * as controller from "../controllers/users.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Example endpoints
router.get("/", controller.getAll);
router.post("/", controller.create);

// Profile endpoints
router.get("/profile", authenticate, controller.getProfile);
router.put("/profile", authenticate, controller.updateProfile);

export default router;
