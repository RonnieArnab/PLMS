import { Router } from "express";
import * as controller from "../controllers/loanProducts.js";

const router = Router();

// Example endpoints
router.get("/", controller.getAll);
router.post("/", controller.create);

export default router;
