import express from "express";
import { signup, login, refreshToken, logout } from "../controllers/auth.js";

const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;
