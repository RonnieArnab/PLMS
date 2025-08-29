import { Router } from "express";
import * as controller from "../controllers/users.js";

const router = Router();

// Example endpoints
router.get("/", controller.getAll);
router.post("/", controller.create);

export default router;
