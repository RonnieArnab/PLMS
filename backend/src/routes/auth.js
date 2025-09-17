// backend/src/routes/auth.js
import express from "express";
import {
  signup,
  registerCustomer,
  login,
  refreshToken,
  logout,
  verifyEmail,
} from "../controllers/auth.js";

const router = express.Router();

// Create user only
router.post("/signup", signup);

// Create user if needed then customer profile (transactional)
router.post("/register-customer", registerCustomer);

// Auth
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// Email verification (GET used by email link)
router.get("/verify-email", verifyEmail);

export default router;
