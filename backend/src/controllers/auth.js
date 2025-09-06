import pool from "../config/db.js";
import { env } from "../config/env.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

// Helper to issue tokens
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.user_id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user.user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
}

// ================== SIGNUP ==================
export const signup = async (req, res) => {
  try {
    const { email, password, phone, aadhaar, pan, role } = req.body;

    // 1. Check if email already exists
    const existing = await pool.query("SELECT 1 FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 2. Hash password
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    // 3. Insert user
    const query = `
      INSERT INTO users (email, password_hash, role, phone_number, aadhaar_no, pan_no)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, email, role, created_at;
    `;
    const values = [email, passwordHash, role || "USER", phone, aadhaar, pan];
    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    // 4. Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // 5. Store refresh token in DB
    await pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [
      refreshToken,
      newUser.user_id,
    ]);

    // 6. Set refresh token in secure cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 7. Response
    res.status(201).json({
      message: "✅ Signup successful",
      user: {
        id: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
    });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================== LOGIN ==================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Fetch user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = result.rows[0];

    // 2. Verify password
    const isMatch = await argon2.verify(user.password_hash, password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // 4. Update DB with refresh token
    await pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [
      refreshToken,
      user.user_id,
    ]);

    // 5. Send refresh token as cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 6. Response
    res.json({
      message: "✅ Login successful",
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================== REFRESH TOKEN ==================
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(204).end();

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid refresh token" });

      // Check token in DB
      const result = await pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [decoded.userId]
      );
      if (result.rows.length === 0 || result.rows[0].refresh_token !== token) {
        return res.status(403).json({ error: "Refresh token not valid" });
      }

      // Rotate refresh token
      const { accessToken, refreshToken: newRefresh } = generateTokens(
        result.rows[0]
      );
      const user = await pool.query(
        "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
        [newRefresh, decoded.userId]
      );

      // Update cookie
      res.cookie("refreshToken", newRefresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: accessToken,
        user: {
          id: user.user_id,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ================== LOGOUT ==================
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.userId) {
        await pool.query(
          "UPDATE users SET refresh_token = NULL WHERE user_id = $1",
          [decoded.userId]
        );
      }
    }
    res.clearCookie("refreshToken");
    res.json({ message: "✅ Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
