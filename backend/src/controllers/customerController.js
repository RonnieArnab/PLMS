import path from "path";
import fs from "fs/promises";
import multer from "multer";
import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_SUBDIR = path.join("uploads", "kyc");
const uploadDir = path.join(process.cwd(), UPLOAD_SUBDIR);

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

function safeServerError(res, err, msg = "Internal server error") {
  console.error(msg, err?.stack || err);
  return res.status(500).json({ error: msg });
}

async function ensureNomineeColumns() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE customerprofile ADD COLUMN IF NOT EXISTS nominee VARCHAR(255) DEFAULT NULL;`
    );
    await client.query(
      `ALTER TABLE customerprofile ADD COLUMN IF NOT EXISTS nominee_contact VARCHAR(20) DEFAULT NULL;`
    );
    await client.query(
      `ALTER TABLE customerprofile ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL;`
    );
    await client.query(
      `ALTER TABLE customerprofile ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();`
    );
  } catch (err) {
    console.error("Error adding nominee columns:", err);
  } finally {
    client.release();
  }
}

async function safeUnlinkIfInsideUploadDir(filename) {
  if (!filename) return;
  try {
    const full = path.join(uploadDir, path.basename(filename));
    const resolved = path.resolve(full);
    if (!resolved.startsWith(path.resolve(uploadDir))) return;
    await fs.unlink(resolved).catch(() => {});
  } catch (e) {
    console.warn("safeUnlinkIfInsideUploadDir failed:", e);
  }
}

async function fetchCombinedUser(userId) {
  await ensureNomineeColumns();
  const q = `
    SELECT u.user_id, u.email, u.role, u.phone_number,
           c.customer_id, u.full_name, c.aadhaar_no, c.pan_no, c.profession,
           c.years_experience, c.annual_income, c.kyc_status, c.address, c.account_id,
           c.nominee, c.nominee_contact, c.date_of_birth,
           c.created_at as customer_created_at, u.created_at as user_created_at,
           b.bank_name, b.account_number, b.ifsc_code, b.account_type, b.is_primary
    FROM users u
    LEFT JOIN customerprofile c ON c.user_id = u.user_id
    LEFT JOIN bank_accounts b ON b.customer_id = c.customer_id
    WHERE u.user_id = $1
    LIMIT 1
  `;
  const r = await pool.query(q, [userId]);

  if (!r.rows.length) return null;
  const row = r.rows[0];

  console.log(row);

  // Calculate age from date_of_birth
  let age = null;
  if (row.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(row.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }

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
    nominee: row.nominee || null,
    nominee_contact: row.nominee_contact || null,
    date_of_birth: row.date_of_birth || null,
    age: age,
    customer_created_at: row.customer_created_at || null,
    // Bank account details
    bank_name: row.bank_name || null,
    account_number: row.account_number || null,
    ifsc_code: row.ifsc_code || null,
    account_type: row.account_type || null,
    is_primary: row.is_primary || null,
  };
}

export const completeCustomerProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

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

    const userRes = await client.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [userId]
    );
    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

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

    const cpQ =
      "SELECT customer_id, account_id FROM customerprofile WHERE user_id = $1";
    const cpRes = await client.query(cpQ, [userId]);
    let accountIdToUse = null;

    if (bank_name && account_number) {
      const accCheck = await client.query(
        "SELECT account_id, customer_id FROM bank_accounts WHERE account_number = $1",
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
      const insertQ = `
        INSERT INTO customerprofile
          (user_id, full_name, aadhaar_no, pan_no, profession, years_experience,
          annual_income, kyc_status, address, account_id, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
        RETURNING customer_id, user_id, full_name, aadhaar_no, pan_no, profession,
        years_experience, annual_income, kyc_status, address, account_id, created_at
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
      if (req.body.nominee !== undefined) push("nominee", req.body.nominee);
      if (req.body.nominee_contact !== undefined)
        push("nominee_contact", req.body.nominee_contact);
      if (req.body.date_of_birth !== undefined)
        push("date_of_birth", req.body.date_of_birth);

      if (!sets.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No updatable fields provided" });
      }

      const updateQ = `UPDATE customerprofile SET ${sets.join(
        ", "
      )}, updated_at = NOW() WHERE user_id = $${idx} RETURNING *`;
      vals.push(userId);
      const updRes = await client.query(updateQ, vals);

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

export const patchCustomerMe = async (req, res) => {
  await ensureNomineeColumns();
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Allowed fields for customerprofile + phone is allowed to update users table
    const ALLOWED = new Set([
      "full_name",
      "phone",
      "aadhaar_no",
      "pan_no",
      "profession",
      "years_experience",
      "annual_income",
      "address",
      "nominee",
      "nominee_contact",
      "date_of_birth",
      // bank-related fields (handled separately)
      "bank_name",
      "account_number",
      "ifsc_code",
      "account_type",
      "is_primary",
    ]);

    // Collect incoming fields and split profile updates vs bank updates
    const incoming = req.body || {};
    const profileUpdates = {};
    const bankIncoming = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (!ALLOWED.has(k)) continue;
      // normalize empty string -> null
      const val = v === "" ? null : v;
      if (
        [
          "bank_name",
          "account_number",
          "ifsc_code",
          "account_type",
          "is_primary",
        ].includes(k)
      ) {
        bankIncoming[k] = val;
      } else {
        profileUpdates[k] = val;
      }
    }

    if (
      !Object.keys(profileUpdates).length &&
      !Object.keys(bankIncoming).length
    ) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    // Basic validations
    if (
      profileUpdates.aadhaar_no &&
      !/^\d{12}$/.test(String(profileUpdates.aadhaar_no))
    ) {
      return res.status(400).json({
        error: "Invalid Aadhaar format",
        errors: { aadhaar_no: "invalid" },
      });
    }

    if (
      profileUpdates.pan_no &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(String(profileUpdates.pan_no))
    ) {
      return res.status(400).json({
        error: "Invalid PAN format",
        errors: { pan_no: "invalid" },
      });
    }

    if (
      profileUpdates.date_of_birth &&
      !/^\d{4}-\d{2}-\d{2}$/.test(String(profileUpdates.date_of_birth))
    ) {
      return res.status(400).json({
        error: "Invalid date_of_birth format",
        errors: { date_of_birth: "use YYYY-MM-DD" },
      });
    }

    if (
      profileUpdates.years_experience !== undefined &&
      profileUpdates.years_experience !== null &&
      (isNaN(Number(profileUpdates.years_experience)) ||
        Number(profileUpdates.years_experience) < 0)
    ) {
      return res.status(400).json({
        error: "Invalid years_experience",
        errors: { years_experience: "invalid" },
      });
    }

    if (
      profileUpdates.annual_income !== undefined &&
      profileUpdates.annual_income !== null &&
      (isNaN(Number(profileUpdates.annual_income)) ||
        Number(profileUpdates.annual_income) < 0)
    ) {
      return res.status(400).json({
        error: "Invalid annual_income",
        errors: { annual_income: "invalid" },
      });
    }

    // Bank basic checks
    if (
      bankIncoming.ifsc_code !== undefined &&
      bankIncoming.ifsc_code !== null &&
      String(bankIncoming.ifsc_code).length < 6
    ) {
      return res.status(400).json({
        error: "IFSC looks short",
        errors: { ifsc_code: "invalid" },
      });
    }

    if (
      bankIncoming.account_number !== undefined &&
      bankIncoming.account_number !== null &&
      !/^[\d-]{6,24}$/.test(String(bankIncoming.account_number))
    ) {
      return res.status(400).json({
        error: "Account number looks invalid",
        errors: { account_number: "invalid" },
      });
    }

    // Normalize is_primary
    if (
      bankIncoming.is_primary !== undefined &&
      bankIncoming.is_primary !== null
    ) {
      const b = bankIncoming.is_primary;
      bankIncoming.is_primary =
        b === true || b === "true" || b === "1" ? true : false;
    }

    await client.query("BEGIN");

    // Ensure user exists
    const userRes = await client.query(
      "SELECT user_id, email, phone_number, full_name FROM users WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    // Unique checks for PAN / Aadhaar (exclude current user)
    if (profileUpdates.pan_no) {
      const r = await client.query(
        "SELECT customer_id FROM customerprofile WHERE pan_no = $1 AND user_id <> $2 LIMIT 1",
        [profileUpdates.pan_no, userId]
      );
      if (r.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "PAN already in use",
          errors: { pan_no: "already_in_use" },
        });
      }
    }

    if (profileUpdates.aadhaar_no) {
      const r = await client.query(
        "SELECT customer_id FROM customerprofile WHERE aadhaar_no = $1 AND user_id <> $2 LIMIT 1",
        [profileUpdates.aadhaar_no, userId]
      );
      if (r.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Aadhaar already in use",
          errors: { aadhaar_no: "already_in_use" },
        });
      }
    }

    // Check if customerprofile exists
    const cpCheck = await client.query(
      "SELECT * FROM customerprofile WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    // Update users table for phone/full_name if provided (non-destructive)
    if (profileUpdates.phone || profileUpdates.full_name) {
      const phoneVal = profileUpdates.phone ?? null;
      const fullNameVal = profileUpdates.full_name ?? null;
      await client.query(
        `UPDATE users
         SET phone_number = COALESCE($1, phone_number),
             full_name = COALESCE($2, full_name),
             updated_at = NOW()
         WHERE user_id = $3`,
        [phoneVal, fullNameVal, userId]
      );
      // keep the values for profile update as well (full_name)
    }

    // Helper to handle bank upsert logic and set customerprofile.account_id
    const handleBankUpdates = async (customerId) => {
      // If no bank info provided, do nothing
      if (
        !("account_number" in bankIncoming) &&
        !("bank_name" in bankIncoming) &&
        !("ifsc_code" in bankIncoming) &&
        !("account_type" in bankIncoming) &&
        !("is_primary" in bankIncoming)
      ) {
        return null;
      }

      // If account_number explicitly set to null -> unset account_id on profile
      if (bankIncoming.account_number === null) {
        await client.query(
          "UPDATE customerprofile SET account_id = NULL WHERE customer_id = $1",
          [customerId]
        );
        return null;
      }

      // If account_number provided -> ensure uniqueness
      if (bankIncoming.account_number) {
        const exist = await client.query(
          "SELECT account_id, customer_id FROM bank_accounts WHERE account_number = $1 LIMIT 1",
          [bankIncoming.account_number]
        );

        if (exist.rows.length) {
          const row = exist.rows[0];
          if (row.customer_id !== customerId) {
            // Another customer owns this account -> conflict
            throw {
              status: 409,
              body: {
                error: "Account number already in use",
                errors: { account_number: "already_in_use" },
              },
            };
          }
          // same customer - update the bank row with any provided fields
          const updates = [];
          const vals = [];
          let idx = 1;
          if (bankIncoming.bank_name !== undefined) {
            updates.push(`bank_name = $${idx++}`);
            vals.push(bankIncoming.bank_name);
          }
          if (bankIncoming.ifsc_code !== undefined) {
            updates.push(`ifsc_code = $${idx++}`);
            vals.push(bankIncoming.ifsc_code);
          }
          if (bankIncoming.account_type !== undefined) {
            updates.push(`account_type = $${idx++}`);
            vals.push(bankIncoming.account_type);
          }
          if (bankIncoming.is_primary !== undefined) {
            updates.push(`is_primary = $${idx++}`);
            vals.push(bankIncoming.is_primary);
          }
          if (updates.length) {
            vals.push(row.account_id);
            const uq = `UPDATE bank_accounts SET ${updates.join(
              ", "
            )}, updated_at = NOW() WHERE account_id = $${vals.length}`;
            await client.query(uq, vals);
          }
          // If is_primary true, clear other primaries
          if (bankIncoming.is_primary) {
            await client.query(
              "UPDATE bank_accounts SET is_primary = false WHERE customer_id = $1 AND account_id <> $2",
              [customerId, row.account_id]
            );
          }

          // update profile.account_id to this account
          await client.query(
            "UPDATE customerprofile SET account_id = $1 WHERE customer_id = $2",
            [row.account_id, customerId]
          );
          return row.account_id;
        } else {
          // Insert new bank row for this customer
          const insertQ = `INSERT INTO bank_accounts
            (customer_id, bank_name, branch_name, ifsc_code, account_number, account_type, is_primary, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
            RETURNING account_id`;
          const isPrimaryVal =
            bankIncoming.is_primary === undefined
              ? true
              : !!bankIncoming.is_primary;
          const insertVals = [
            customerId,
            bankIncoming.bank_name || null,
            null,
            bankIncoming.ifsc_code || null,
            bankIncoming.account_number,
            bankIncoming.account_type || null,
            isPrimaryVal,
          ];
          const ai = await client.query(insertQ, insertVals);
          const newAccountId = ai.rows[0].account_id;

          // if is_primary true, clear other primaries
          if (isPrimaryVal) {
            await client.query(
              "UPDATE bank_accounts SET is_primary = false WHERE customer_id = $1 AND account_id <> $2",
              [customerId, newAccountId]
            );
          }

          // update profile.account_id
          await client.query(
            "UPDATE customerprofile SET account_id = $1 WHERE customer_id = $2",
            [newAccountId, customerId]
          );

          return newAccountId;
        }
      }

      // If account_number not provided but other bank fields provided, and profile.account_id exists -> update existing bank row
      const cp = await client.query(
        "SELECT account_id FROM customerprofile WHERE customer_id = $1 LIMIT 1",
        [customerId]
      );
      const currentAccountId = cp.rows[0]?.account_id ?? null;
      if (!currentAccountId) {
        // no account to update and no account_number provided -> insert a new row (requires account_number)
        // nothing to do
        return null;
      }

      // update the existing bank row
      const updates = [];
      const vals = [];
      let idx = 1;
      if (bankIncoming.bank_name !== undefined) {
        updates.push(`bank_name = $${idx++}`);
        vals.push(bankIncoming.bank_name);
      }
      if (bankIncoming.ifsc_code !== undefined) {
        updates.push(`ifsc_code = $${idx++}`);
        vals.push(bankIncoming.ifsc_code);
      }
      if (bankIncoming.account_type !== undefined) {
        updates.push(`account_type = $${idx++}`);
        vals.push(bankIncoming.account_type);
      }
      if (bankIncoming.is_primary !== undefined) {
        updates.push(`is_primary = $${idx++}`);
        vals.push(bankIncoming.is_primary);
      }

      if (updates.length) {
        vals.push(currentAccountId);
        const uq = `UPDATE bank_accounts SET ${updates.join(
          ", "
        )}, updated_at = NOW() WHERE account_id = $${vals.length}`;
        await client.query(uq, vals);

        if (bankIncoming.is_primary) {
          await client.query(
            "UPDATE bank_accounts SET is_primary = false WHERE customer_id = $1 AND account_id <> $2",
            [customerId, currentAccountId]
          );
        }
      }

      return currentAccountId;
    }; // end handleBankUpdates

    if (!cpCheck.rows.length) {
      // Insert new customerprofile
      const insertQ = `
        INSERT INTO customerprofile 
          (user_id, full_name, aadhaar_no, pan_no, profession,
           years_experience, annual_income, address, nominee, nominee_contact, date_of_birth, kyc_status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING', NOW())
        RETURNING *
      `;
      const iv = [
        userId,
        profileUpdates.full_name || null,
        profileUpdates.aadhaar_no || null,
        profileUpdates.pan_no || null,
        profileUpdates.profession || null,
        profileUpdates.years_experience ?? null,
        profileUpdates.annual_income ?? null,
        profileUpdates.address || null,
        profileUpdates.nominee || null,
        profileUpdates.nominee_contact || null,
        profileUpdates.date_of_birth || null,
      ];
      const insR = await client.query(insertQ, iv);
      const createdProfile = insR.rows[0];

      // handle bank creation if provided
      try {
        await handleBankUpdates(createdProfile.customer_id);
      } catch (e) {
        // allow handleBankUpdates to throw structured error
        await client.query("ROLLBACK");
        if (e?.status && e?.body) return res.status(e.status).json(e.body);
        throw e;
      }

      await client.query("COMMIT");
      const completeUser = await fetchCombinedUser(userId);
      return res.status(201).json({ user: completeUser });
    } else {
      // Update existing profile
      const existing = cpCheck.rows[0];

      // Determine if sensitive fields changed -> reset kyc_status
      let resetKyc = false;
      if (
        profileUpdates.pan_no !== undefined &&
        profileUpdates.pan_no !== null &&
        String(profileUpdates.pan_no) !== String(existing.pan_no)
      ) {
        resetKyc = true;
      }
      if (
        profileUpdates.aadhaar_no !== undefined &&
        profileUpdates.aadhaar_no !== null &&
        String(profileUpdates.aadhaar_no) !== String(existing.aadhaar_no)
      ) {
        resetKyc = true;
      }

      // Build update for profile (skip phone - updated on users table)
      const sets = [];
      const vals = [];
      let idx = 1;
      for (const [k, v] of Object.entries(profileUpdates)) {
        if (k === "phone") continue;
        sets.push(`${k} = $${idx++}`);
        vals.push(v);
      }

      if (resetKyc) {
        sets.push(`kyc_status = $${idx++}`);
        vals.push("PENDING");
      }

      if (sets.length) {
        // add updated_at and where clause
        const whereIdx = idx;
        vals.push(userId);
        const updateQ = `UPDATE customerprofile SET ${sets.join(
          ", "
        )}, updated_at = NOW() WHERE user_id = $${whereIdx} RETURNING *`;
        await client.query(updateQ, vals);
      }

      // Now handle bank updates (may throw structured error)
      try {
        await handleBankUpdates(existing.customer_id);
      } catch (e) {
        await client.query("ROLLBACK");
        if (e?.status && e?.body) return res.status(e.status).json(e.body);
        throw e;
      }

      await client.query("COMMIT");
      const completeUser = await fetchCombinedUser(userId);
      return res.json({ user: completeUser });
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("patchCustomerMe error:", err);

    // handle unique constraint failures more gracefully
    if (err?.code === "23505") {
      const detail = err.detail || "";
      const field = detail.match(/\((.*?)\)=/)?.[1] || null;
      const errors = field ? { [field]: "already_exists" } : {};
      return res
        .status(409)
        .json({ error: "Unique constraint violation", errors });
    }

    return res.status(500).json({ error: "Failed to update profile" });
  } finally {
    client.release();
  }
};

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

export const postCustomerKyc = async (req, res) => {
  const client = await pool.connect();

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

    if (aadhaar_no && !/^\d{12}$/.test(String(aadhaar_no))) {
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
      return res.status(400).json({
        error: "Invalid PAN format",
        errors: { pan_no: "invalid" },
      });
    }

    await client.query("BEGIN");

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
        (user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income,
         address, pan_file_path, aadhaar_file_path, kyc_status, created_at)
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
