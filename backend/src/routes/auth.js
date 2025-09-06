import { Router } from "express";
import { signup, login, refreshToken, logout } from "../controllers/auth.js";
import { validateSignup, validateLogin } from "../middleware/validator.js";

const router = Router();

router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;
