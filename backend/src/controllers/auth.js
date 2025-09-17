import pool from "../config/db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { badRequest, conflict, serverError } from "./responseHelpers.js";

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

export const signup = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, phone, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email & password required" });

    const exists = await client.query("SELECT 1 FROM users WHERE email = $1", [
      email,
    ]);
    if (exists.rows.length)
      return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const insertQ = `INSERT INTO users (email, password_hash, role, phone_number) VALUES ($1,$2,$3,$4) RETURNING user_id,email,role,created_at`;
    const values = [email, passwordHash, role || "CUSTOMER", phone || null];
    const result = await client.query(insertQ, values);
    const newUser = result.rows[0];

    const { accessToken, refreshToken } = generateTokens(newUser);
    await client.query(
      "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
      [refreshToken, newUser.user_id]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "✅ Signup successful",
      user: { id: newUser.user_id, email: newUser.email, role: newUser.role },
      accessToken,
    });
  } catch (err) {
    console.error("Signup Error", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

/**
 * registerCustomer - idempotent:
 * - If req.user exists -> attach profile to that user_id
 * - Else if user with email exists and no customerprofile -> attach to that user
 * - Else if user with email exists and profile exists -> return 409
 * - Else create user + profile
 *
 * Request body: { email, password, phone, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, address }
 *
 * Responses:
 * - 201 { message, user, customer, accessToken? }  (created/attached)
 * - 400 { error, errors } (validation)
 * - 409 { error, errors } (already registered)
 * - 500 { error }
 */
export const registerCustomer = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      email,
      password,
      phone,
      full_name,
      aadhaar_no,
      pan_no,
      profession,
      years_experience,
      annual_income,
      address,
    } = req.body;

    // Basic validation
    if (!email && !req.user) {
      return res.status(400).json({
        error: "Missing required fields",
        errors: { email: "required when not authenticated" },
      });
    }
    if (!full_name) {
      return res.status(400).json({
        error: "Missing required fields",
        errors: { full_name: "required" },
      });
    }

    await client.query("BEGIN");

    // Determine userId to attach profile to:
    // Priority:
    //  1) req.user.userId (authenticated)
    //  2) existing user by email (if exists and doesn't have profile)
    //  3) create new user (requires password)
    let userId = null;
    let createdUser = null;

    // 1) authenticated path
    const authUserId = req.user?.userId ?? req.user?.user_id;
    if (authUserId) {
      const userQ =
        "SELECT user_id, email, role FROM users WHERE user_id = $1 LIMIT 1";
      const userRes = await client.query(userQ, [authUserId]);
      if (userRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Authenticated user not found" });
      }
      userId = userRes.rows[0].user_id;
    } else {
      // 2) not authenticated: check by email
      const userByEmailQ =
        "SELECT user_id, email, role FROM users WHERE email = $1 LIMIT 1";
      const ue = await client.query(userByEmailQ, [email]);
      if (ue.rows.length) {
        const existingUser = ue.rows[0];

        // check if that user already has profile
        const profQ =
          "SELECT customer_id FROM customerprofile WHERE user_id = $1 LIMIT 1";
        const profRes = await client.query(profQ, [existingUser.user_id]);
        if (profRes.rows.length) {
          // profile exists -> return 409
          await client.query("ROLLBACK");
          return res.status(409).json({
            error: "Email already registered with customer profile",
            errors: { email: "already_registered" },
          });
        }
        // reuse existing user (no profile yet)
        userId = existingUser.user_id;
      } else {
        // 3) create user row
        if (!password) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Missing required fields",
            errors: { password: "required when creating a new user" },
          });
        }
        const passwordHash = await argon2.hash(password, {
          type: argon2.argon2id,
        });
        const createUserQ = `INSERT INTO users (email, password_hash, role, phone_number)
                             VALUES ($1,$2,'CUSTOMER',$3) RETURNING user_id, email, role`;
        const createRes = await client.query(createUserQ, [
          email,
          passwordHash,
          phone || null,
        ]);
        createdUser = createRes.rows[0];
        userId = createdUser.user_id;
      }
    }

    // Double-check no existing profile for userId (defensive)
    const checkProfileQ =
      "SELECT customer_id FROM customerprofile WHERE user_id = $1 LIMIT 1";
    const cp = await client.query(checkProfileQ, [userId]);
    if (cp.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Customer profile already exists for this user",
        errors: { user: "customer_profile_exists" },
      });
    }

    // Insert customerprofile first
    const custInsertQ = `INSERT INTO customerprofile
      (user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, address)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING customer_id, user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, kyc_status, address, created_at`;
    const custRes = await client.query(custInsertQ, [
      userId,
      full_name,
      aadhaar_no || null,
      pan_no || null,
      profession || null,
      years_experience ?? null,
      annual_income ?? null,
      address || null,
    ]);
    const createdProfile = custRes.rows[0];

    // Handle bank account creation if bank details provided
    let accountIdToUse = null;
    const { bank_name, account_number, ifsc_code, account_type } = req.body;

    if (bank_name && account_number) {
      const accCheck = await client.query(
        "SELECT account_id FROM bank_accounts WHERE account_number = $1",
        [account_number]
      );
      if (accCheck.rows.length) {
        accountIdToUse = accCheck.rows[0].account_id;
      } else {
        const insertAccQ = `
          INSERT INTO bank_accounts
            (customer_id, bank_name, branch_name, ifsc_code, account_number, account_type, is_primary, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
          RETURNING account_id
        `;
        const accValues = [
          createdProfile.customer_id,
          bank_name,
          null, // branch_name
          ifsc_code || null,
          account_number,
          account_type || null,
          true, // is_primary for new registrations
        ];
        const ai = await client.query(insertAccQ, accValues);
        accountIdToUse = ai.rows[0].account_id;
      }

      // Update customerprofile with account_id
      await client.query(
        "UPDATE customerprofile SET account_id = $1 WHERE customer_id = $2",
        [accountIdToUse, createdProfile.customer_id]
      );
      createdProfile.account_id = accountIdToUse;
    }

    // If we created a new user just now, issue tokens and store refresh_token
    let accessToken = null;
    if (createdUser) {
      const tokens = generateTokens(createdUser);
      accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;
      await client.query(
        "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
        [refreshToken, createdUser.user_id]
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Customer registered",
      user: createdUser
        ? {
            id: createdUser.user_id,
            email: createdUser.email,
            role: createdUser.role,
          }
        : { id: userId },
      customer: createdProfile,
      accessToken, // may be null if reusing existing user (frontend should call restoreSession)
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("registerCustomer Error:", err);

    // Postgres unique violation (e.g. aadhaar/pan or email)
    if (err?.code === "23505") {
      const detail = err.detail || "";
      const field = detail.match(/\((.*?)\)=/)?.[1] || null;
      const errors = field ? { [field]: "already_exists" } : {};
      return res
        .status(409)
        .json({ error: "Unique constraint violation", errors });
    }

    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const createAdmin = async (req, res) => {
  const client = await pool.connect();
  try {
    const creator = req.user;
    if (!creator || creator.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });

    const {
      email,
      password,
      phone,
      full_name,
      department,
      designation,
      is_superadmin,
    } = req.body;
    if (!email || !password || !full_name)
      return res
        .status(400)
        .json({ error: "email, password and full_name required" });

    await client.query("BEGIN");

    const exists = await client.query("SELECT 1 FROM users WHERE email = $1", [
      email,
    ]);
    if (exists.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const insertUserQ = `INSERT INTO users (email,password_hash,role,phone_number) VALUES ($1,$2,'ADMIN',$3) RETURNING user_id,email,role`;
    const uRes = await client.query(insertUserQ, [
      email,
      passwordHash,
      phone || null,
    ]);
    const newUser = uRes.rows[0];

    const insertAdminQ = `INSERT INTO adminprofile (user_id, full_name, department, designation, is_superadmin) VALUES ($1,$2,$3,$4,$5)`;
    await client.query(insertAdminQ, [
      newUser.user_id,
      full_name,
      department || null,
      designation || null,
      !!is_superadmin,
    ]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "✅ Admin created",
      user: { id: newUser.user_id, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("createAdmin Error", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = result.rows[0];

    const isMatch = await argon2.verify(user.password_hash, password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid email or password" });

    const { accessToken, refreshToken } = generateTokens(user);
    await pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [
      refreshToken,
      user.user_id,
    ]);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Start with base user info
    let userResponse = {
      id: user.user_id,
      email: user.email,
      role: user.role,
    };

    // Merge customer profile fields if applicable
    if (user.role === "CUSTOMER") {
      const prof = await pool.query(
        `SELECT customer_id, full_name, aadhaar_no, pan_no, profession,
                years_experience, annual_income, kyc_status, address, account_id
         FROM customerprofile WHERE user_id = $1`,
        [user.user_id]
      );

      if (prof.rows.length) {
        userResponse = {
          ...userResponse,
          ...prof.rows[0], // flatten fields into the same object
        };
      }
    }

    res.json({
      message: "✅ Login successful",
      user: userResponse,
      accessToken,
    });
  } catch (err) {
    console.error("Login Error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(204).end();

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid refresh token" });

      const userRow = await pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [decoded.userId]
      );
      if (userRow.rows.length === 0)
        return res.status(403).json({ error: "Refresh token not valid" });

      const dbUser = userRow.rows[0];
      if (!dbUser.refresh_token || dbUser.refresh_token !== token)
        return res.status(403).json({ error: "Refresh token not valid" });

      // Generate new tokens
      const { accessToken, refreshToken: newRefresh } = generateTokens(dbUser);

      const upd = await pool.query(
        "UPDATE users SET refresh_token = $1 WHERE user_id = $2 RETURNING user_id, email, role",
        [newRefresh, dbUser.user_id]
      );
      const updatedUser = upd.rows[0];

      // Get profile name depending on role
      let fullName = null;
      if (updatedUser.role === "CUSTOMER") {
        const prof = await pool.query(
          "SELECT full_name FROM customerprofile WHERE user_id = $1",
          [updatedUser.user_id]
        );
        if (prof.rows.length) {
          fullName = prof.rows[0].full_name;
        }
      } else if (updatedUser.role === "ADMIN") {
        const prof = await pool.query(
          "SELECT full_name FROM adminprofile WHERE user_id = $1",
          [updatedUser.user_id]
        );
        if (prof.rows.length) {
          fullName = prof.rows[0].full_name;
        }
      }

      res.cookie("refreshToken", newRefresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken,
        user: {
          id: updatedUser.user_id,
          email: updatedUser.email,
          role: updatedUser.role,
          full_name: fullName, // 👈 added here
        },
      });
    });
  } catch (err) {
    console.error("refreshToken Error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
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
    console.error("Logout Error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listCustomers = async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT u.user_id, u.email, u.phone_number, c.customer_id, c.full_name, c.kyc_status FROM users u JOIN customerprofile c ON c.user_id = u.user_id ORDER BY c.created_at DESC LIMIT 200`
    );
    res.json({ customers: rows.rows });
  } catch (err) {
    console.error("listCustomers Error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;
    const q = `SELECT u.user_id, u.email, u.phone_number, c.* FROM users u JOIN customerprofile c ON c.user_id = u.user_id WHERE c.customer_id = $1`;
    const r = await pool.query(q, [customerId]);
    if (r.rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ customer: r.rows[0] });
  } catch (err) {
    console.error("getCustomerById Error", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
