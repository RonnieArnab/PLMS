// src/controllers/customerController.js
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Customer controller - improved & safer version
 *
 * Exports:
 *  - kycUpload (multer middleware)
 *  - completeCustomerProfile(req, res)
 *  - getCustomerMe(req, res)
 *  - patchCustomerMe(req, res)
 *  - postCustomerKyc(req, res)
 *
 * Assumptions:
 *  - authenticate middleware sets req.user = { userId, role }
 *  - Postgres pool available at ../config/db.js
 */

// ------------------------ Configuration ------------------------
const UPLOAD_SUBDIR = path.join("uploads", "kyc");
const uploadDir = path.join(process.cwd(), UPLOAD_SUBDIR);

// Accept a small set of mimetypes
const ACCEPTED_FILE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
]);

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uid = req.user?.userId || "anon";
    const ext = path.extname(file.originalname) || "";
    const name = `${uid}-${uuidv4()}${ext}`;
    cb(null, name);
  },
});

export const kycUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ACCEPTED_FILE_MIMES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

// ------------------------ Helpers ------------------------
function safeServerError(res, err, msg = "Internal server error") {
  console.error(msg, err?.stack || err);
  return res.status(500).json({ error: msg });
}

async function safeUnlinkIfInsideUploadDir(filename) {
  if (!filename) return;
  try {
    const full = path.join(uploadDir, path.basename(filename));
    // Basic safety: verify the resolved path starts with uploadDir
    const resolved = path.resolve(full);
    if (!resolved.startsWith(path.resolve(uploadDir))) return;
    await fs.unlink(resolved).catch(() => {});
  } catch (e) {
    // ignore unlink errors
    console.warn("safeUnlinkIfInsideUploadDir failed:", e);
  }
}

/**
 * Fetch combined user + customer fields and normalize to a single object
 * Returns user object or null if not found
 */
async function fetchCombinedUser(userId) {
  const q = `
    SELECT u.user_id, u.email, u.role, u.phone_number,
           c.customer_id, c.full_name, c.aadhaar_no, c.pan_no, c.profession,
           c.years_experience, c.annual_income, c.kyc_status, c.address, c.account_id,
           c.created_at as customer_created_at, u.created_at as user_created_at
    FROM users u
    LEFT JOIN customerprofile c ON c.user_id = u.user_id
    WHERE u.user_id = $1
    LIMIT 1
  `;
  const r = await pool.query(q, [userId]);

  if (!r.rows.length) return null;
  const row = r.rows[0];
  return {
    id: row.user_id,
    email: row.email,
    role: row.role,
    phone: row.phone_number,
    created_at: row.user_created_at,
    customer_id: row.customer_id || null,
    full_name: row.full_name || null,
    pan_no: row.pan_no || null,
    aadhaar_no: row.aadhaar_no || null,
    profession: row.profession || null,
    years_experience: row.years_experience ?? null,
    annual_income: row.annual_income ?? null,
    kyc_status: row.kyc_status || null,
    address: row.address || null,
    account_id: row.account_id || null,
    customer_created_at: row.customer_created_at || null,
  };
}

// ------------------------ Controllers ------------------------

/**
 * POST /api/customer/complete
 * Create or update customerprofile and optionally bank account.
 */
export const completeCustomerProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    console.log(userId);

    // allowed inputs
    const {
      full_name,
      aadhaar_no,
      pan_no,
      profession,
      years_experience,
      annual_income,
      address,
      bank_name,
      account_number,
      ifsc_code,
      account_type,
      is_primary,
    } = req.body || {};

    // Basic presence check - require at least one meaningful field
    if (
      !full_name &&
      !aadhaar_no &&
      !pan_no &&
      !profession &&
      !bank_name &&
      !account_number
    ) {
      return res.status(400).json({ error: "No profile data provided" });
    }

    // small validations
    if (aadhaar_no && !/^\d{12}$/.test(String(aadhaar_no))) {
      return res.status(400).json({
        error: "Invalid Aadhaar format",
        errors: { aadhaar_no: "invalid" },
      });
    }
    if (pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(String(pan_no))) {
      return res
        .status(400)
        .json({ error: "Invalid PAN format", errors: { pan_no: "invalid" } });
    }

    await client.query("BEGIN");

    // ensure user exists
    const userRes = await client.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [userId]
    );
    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    // uniqueness checks: do inside transaction to reduce TOCTOU risk
    if (aadhaar_no) {
      const aQ =
        "SELECT customer_id FROM customerprofile WHERE aadhaar_no = $1 AND user_id <> $2";
      const aR = await client.query(aQ, [aadhaar_no, userId]);
      if (aR.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Aadhaar already in use",
          errors: { aadhaar_no: "already_in_use" },
        });
      }
    }
    if (pan_no) {
      const pQ =
        "SELECT customer_id FROM customerprofile WHERE pan_no = $1 AND user_id <> $2";
      const pR = await client.query(pQ, [pan_no, userId]);
      if (pR.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "PAN already in use",
          errors: { pan_no: "already_in_use" },
        });
      }
    }

    // retrieve profile if exists
    const cpQ =
      "SELECT customer_id, account_id FROM customerprofile WHERE user_id = $1";
    const cpRes = await client.query(cpQ, [userId]);
    let accountIdToUse = null;

    // Bank handling: if bank_name & account_number provided, ensure unique or create
    if (bank_name && account_number) {
      const accCheck = await client.query(
        "SELECT account_id, customer_id FROM bank_accounts WHERE account_number = $1",
        [account_number]
      );
      if (accCheck.rows.length) {
        // reuse existing account; if it belongs to another customer, you may want to disallow or handle differently
        accountIdToUse = accCheck.rows[0].account_id;
      } else {
        const insertAccQ = `
          INSERT INTO bank_accounts
            (customer_id, bank_name, branch_name, ifsc_code, account_number, account_type, is_primary, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
          RETURNING account_id
        `;
        // temporarily use customer_id if exists; otherwise null (we'll backfill)
        const custForBank = cpRes.rows.length
          ? cpRes.rows[0].customer_id
          : null;
        const accValues = [
          custForBank,
          bank_name,
          null,
          ifsc_code || null,
          account_number,
          account_type || null,
          !!(is_primary === true || is_primary === "true" || is_primary === 1),
        ];
        const ai = await client.query(insertAccQ, accValues);
        accountIdToUse = ai.rows[0].account_id;
      }
    }

    if (!cpRes.rows.length) {
      // insert profile
      const insertQ = `
        INSERT INTO customerprofile
          (user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, kyc_status, address, account_id, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
        RETURNING customer_id, user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, kyc_status, address, account_id, created_at
      `;
      const insVals = [
        userId,
        full_name || null,
        aadhaar_no || null,
        pan_no || null,
        profession || null,
        years_experience ?? null,
        annual_income ?? null,
        "PENDING",
        address || null,
        accountIdToUse || null,
      ];
      const insRes = await client.query(insertQ, insVals);

      // if earlier bank record was created with NULL customer_id, update it now
      if (accountIdToUse && insRes.rows[0].customer_id) {
        await client.query(
          "UPDATE bank_accounts SET customer_id = $1 WHERE account_id = $2",
          [insRes.rows[0].customer_id, accountIdToUse]
        );
      }

      await client.query("COMMIT");
      const user = await fetchCombinedUser(userId);
      return res
        .status(201)
        .json({ message: "Customer profile created", user });
    } else {
      // update existing profile - dynamic
      const existing = cpRes.rows[0];
      const sets = [];
      const vals = [];
      let idx = 1;
      const push = (col, val) => {
        sets.push(`${col} = $${idx}`);
        vals.push(val);
        idx++;
      };

      if (full_name) push("full_name", full_name);
      if (aadhaar_no) push("aadhaar_no", aadhaar_no);
      if (pan_no) push("pan_no", pan_no);
      if (profession) push("profession", profession);
      if (years_experience !== undefined)
        push("years_experience", years_experience);
      if (annual_income !== undefined) push("annual_income", annual_income);
      if (address) push("address", address);
      if (accountIdToUse) push("account_id", accountIdToUse);

      if (!sets.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No updatable fields provided" });
      }

      const updateQ = `UPDATE customerprofile SET ${sets.join(
        ", "
      )}, updated_at = NOW() WHERE user_id = $${idx} RETURNING *`;
      vals.push(userId);
      const updRes = await client.query(updateQ, vals);

      // if bank created earlier had null customer_id and existing.customer_id exists, update it
      if (accountIdToUse && existing.customer_id) {
        await client.query(
          "UPDATE bank_accounts SET customer_id = $1 WHERE account_id = $2",
          [existing.customer_id, accountIdToUse]
        );
      }

      await client.query("COMMIT");
      const user = await fetchCombinedUser(userId);
      return res
        .status(200)
        .json({ message: "Customer profile updated", user });
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("completeCustomerProfile error:", err);
    if (err?.code === "23505") {
      return res.status(409).json({
        error: "Unique constraint violation (PAN/Aadhaar/Account)",
        details: err.detail,
      });
    }
    return safeServerError(res, err, "Failed to complete customer profile");
  } finally {
    client.release();
  }
};

/**
 * GET /api/customer/me
 */
export const getCustomerMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await fetchCombinedUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    return safeServerError(res, err, "Failed to fetch user");
  }
};

/**
 * PATCH /api/customer/me
 * Partial update of customer profile (whitelisted fields only).
 */
export const patchCustomerMe = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const ALLOWED = new Set([
      "full_name",
      "aadhaar_no",
      "pan_no",
      "profession",
      "years_experience",
      "annual_income",
      "address",
    ]);

    // build updates (whitelisted)
    const updates = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (ALLOWED.has(k)) updates[k] = v === "" ? null : v;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    // basic format validation
    if (updates.aadhaar_no && !/^\d{12}$/.test(String(updates.aadhaar_no))) {
      return res.status(400).json({
        error: "Invalid Aadhaar format",
        errors: { aadhaar_no: "invalid" },
      });
    }
    if (
      updates.pan_no &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(String(updates.pan_no))
    ) {
      return res
        .status(400)
        .json({ error: "Invalid PAN format", errors: { pan_no: "invalid" } });
    }

    await client.query("BEGIN");

    // ensure user exists
    const userRes = await client.query(
      "SELECT user_id, email, role FROM users WHERE user_id = $1",
      [userId]
    );
    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    // unique checks inside transaction
    if (updates.pan_no) {
      const r = await client.query(
        "SELECT customer_id FROM customerprofile WHERE pan_no = $1 AND user_id <> $2",
        [updates.pan_no, userId]
      );
      if (r.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "PAN already in use",
          errors: { pan_no: "already_in_use" },
        });
      }
    }
    if (updates.aadhaar_no) {
      const r = await client.query(
        "SELECT customer_id FROM customerprofile WHERE aadhaar_no = $1 AND user_id <> $2",
        [updates.aadhaar_no, userId]
      );
      if (r.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Aadhaar already in use",
          errors: { aadhaar_no: "already_in_use" },
        });
      }
    }

    // check if profile exists
    const cpCheck = await client.query(
      "SELECT customer_id FROM customerprofile WHERE user_id = $1",
      [userId]
    );

    if (!cpCheck.rows.length) {
      // insert new with provided values (fill missing with null)
      const insertQ = `
        INSERT INTO customerprofile (user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, address, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
        RETURNING *
      `;
      const iv = [
        userId,
        updates.full_name || null,
        updates.aadhaar_no || null,
        updates.pan_no || null,
        updates.profession || null,
        updates.years_experience ?? null,
        updates.annual_income ?? null,
        updates.address || null,
      ];
      const insR = await client.query(insertQ, iv);
      await client.query("COMMIT");
      const user = await fetchCombinedUser(userId);
      return res.status(201).json({ user });
    } else {
      // update existing profile
      const sets = [];
      const vals = [];
      let idx = 1;
      for (const [k, v] of Object.entries(updates)) {
        sets.push(`${k} = $${idx++}`);
        vals.push(v);
      }
      vals.push(userId);
      const updateQ = `UPDATE customerprofile SET ${sets.join(
        ", "
      )}, updated_at = NOW() WHERE user_id = $${vals.length} RETURNING *`;
      await client.query(updateQ, vals);
      await client.query("COMMIT");
      const user = await fetchCombinedUser(userId);
      return res.json({ user });
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("patchCustomerMe error:", err);
    if (err?.code === "23505") {
      const detail = err.detail || "";
      const col = detail.match(/\((.*?)\)=/)?.[1] || null;
      const errors = col ? { [col]: "already_exists" } : undefined;
      return res
        .status(409)
        .json({ error: "Unique constraint violation", errors });
    }
    return safeServerError(res, err, "Failed to update profile");
  } finally {
    client.release();
  }
};

/**
 * POST /api/customer/kyc
 * Accepts multipart form:
 *   - pan_no, aadhaar_no (optional)
 *   - pan_file (optional), aadhaar_file (optional)
 *
 * Returns new combined user object on success.
 */
export const postCustomerKyc = async (req, res) => {
  const client = await pool.connect();
  // req.files.{pan_file,aadhaar_file} where each is array from multer.fields
  let panFileObj = null;
  let aadhaarFileObj = null;
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    panFileObj = (req.files?.pan_file && req.files.pan_file[0]) || null;
    aadhaarFileObj =
      (req.files?.aadhaar_file && req.files.aadhaar_file[0]) || null;
    const { pan_no, aadhaar_no } = req.body || {};

    if (!pan_no && !aadhaar_no && !panFileObj && !aadhaarFileObj) {
      return res.status(400).json({ error: "No KYC data provided" });
    }

    // Basic format validation
    if (aadhaar_no && !/^\d{12}$/.test(String(aadhaar_no))) {
      // cleanup uploaded files if any
      if (panFileObj) await safeUnlinkIfInsideUploadDir(panFileObj.filename);
      if (aadhaarFileObj)
        await safeUnlinkIfInsideUploadDir(aadhaarFileObj.filename);
      return res.status(400).json({
        error: "Invalid Aadhaar format",
        errors: { aadhaar_no: "invalid" },
      });
    }
    if (pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(String(pan_no))) {
      if (panFileObj) await safeUnlinkIfInsideUploadDir(panFileObj.filename);
      if (aadhaarFileObj)
        await safeUnlinkIfInsideUploadDir(aadhaarFileObj.filename);
      return res
        .status(400)
        .json({ error: "Invalid PAN format", errors: { pan_no: "invalid" } });
    }

    await client.query("BEGIN");

    // uniqueness checks
    if (pan_no) {
      const r = await client.query(
        "SELECT customer_id FROM customerprofile WHERE pan_no = $1 AND user_id <> $2",
        [pan_no, userId]
      );
      if (r.rows.length) {
        await client.query("ROLLBACK");
        if (panFileObj) await safeUnlinkIfInsideUploadDir(panFileObj.filename);
        if (aadhaarFileObj)
          await safeUnlinkIfInsideUploadDir(aadhaarFileObj.filename);
        return res.status(409).json({
          error: "PAN already used",
          errors: { pan_no: "already_in_use" },
        });
      }
    }
    if (aadhaar_no) {
      const r = await client.query(
        "SELECT customer_id FROM customerprofile WHERE aadhaar_no = $1 AND user_id <> $2",
        [aadhaar_no, userId]
      );
      if (r.rows.length) {
        await client.query("ROLLBACK");
        if (panFileObj) await safeUnlinkIfInsideUploadDir(panFileObj.filename);
        if (aadhaarFileObj)
          await safeUnlinkIfInsideUploadDir(aadhaarFileObj.filename);
        return res.status(409).json({
          error: "Aadhaar already used",
          errors: { aadhaar_no: "already_in_use" },
        });
      }
    }

    const cpRes = await client.query(
      "SELECT customer_id FROM customerprofile WHERE user_id = $1",
      [userId]
    );

    const toSet = [];
    const vals = [];
    let idx = 1;
    const push = (col, val) => {
      toSet.push(`${col} = $${idx}`);
      vals.push(val);
      idx++;
    };

    if (pan_no) push("pan_no", pan_no);
    if (aadhaar_no) push("aadhaar_no", aadhaar_no);
    if (panFileObj)
      push("pan_file_path", path.join(UPLOAD_SUBDIR, panFileObj.filename));
    if (aadhaarFileObj)
      push(
        "aadhaar_file_path",
        path.join(UPLOAD_SUBDIR, aadhaarFileObj.filename)
      );

    if (toSet.length > 0) push("kyc_status", "PENDING");

    if (!cpRes.rows.length) {
      const insertQ = `INSERT INTO customerprofile
        (user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, address, pan_file_path, aadhaar_file_path, kyc_status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
        RETURNING *`;
      const insVals = [
        userId,
        null,
        aadhaar_no || null,
        pan_no || null,
        null,
        null,
        null,
        null,
        panFileObj ? path.join(UPLOAD_SUBDIR, panFileObj.filename) : null,
        aadhaarFileObj
          ? path.join(UPLOAD_SUBDIR, aadhaarFileObj.filename)
          : null,
        toSet.length > 0 ? "PENDING" : null,
      ];
      await client.query(insertQ, insVals);
    } else if (toSet.length > 0) {
      const updateQ = `UPDATE customerprofile SET ${toSet.join(
        ", "
      )}, updated_at = NOW() WHERE user_id = $${idx} RETURNING *`;
      vals.push(userId);
      await client.query(updateQ, vals);
    }

    await client.query("COMMIT");
    const user = await fetchCombinedUser(userId);
    return res.status(200).json({ message: "KYC updated", user });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("postCustomerKyc error:", err);
    // try to cleanup any uploaded files
    try {
      if (req?.files?.pan_file?.[0])
        await safeUnlinkIfInsideUploadDir(req.files.pan_file[0].filename);
      if (req?.files?.aadhaar_file?.[0])
        await safeUnlinkIfInsideUploadDir(req.files.aadhaar_file[0].filename);
    } catch (_) {}
    if (err?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Unique constraint violation", detail: err.detail });
    }
    return safeServerError(res, err, "Failed to submit KYC");
  } finally {
    client.release();
  }
};
