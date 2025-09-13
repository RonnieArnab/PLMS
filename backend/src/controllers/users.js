import pool from "../config/db.js";

export async function getAll(req, res) {
  const user = await pool.query("SELECT * FROM users");
  res.json({ service: "users", action: "getAll", user: user.rows });
}

export async function create(req, res) {
  res.json({ service: "users", action: "create", data: req.body });
}

export async function getProfile(req, res) {
  const { userId } = req.user;
  try {
    const userQuery = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);
    if (userQuery.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const user = userQuery.rows[0];
    let profile = {
      user_id: user.user_id,
      email: user.email,
      phone: user.phone_number,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    if (user.role === "CUSTOMER") {
      const customerQuery = await pool.query(
        "SELECT * FROM customerprofile WHERE user_id = $1",
        [userId]
      );
      if (customerQuery.rows.length > 0) {
        const customer = customerQuery.rows[0];
        profile.name = customer.full_name;
        profile.aadhaar = customer.aadhaar_no;
        profile.pan = customer.pan_no;
        profile.employment = customer.profession;
        profile.monthlyIncome = customer.annual_income
          ? (customer.annual_income / 12).toFixed(2)
          : null;
        profile.address = customer.address;
        profile.kyc_status = customer.kyc_status;
        profile.nominee = customer.nominee || null;
        profile.nomineeContact = customer.nominee_contact || null;

        if (customer.account_id) {
          const bankQuery = await pool.query(
            "SELECT * FROM bank_accounts WHERE account_id = $1",
            [customer.account_id]
          );
          if (bankQuery.rows.length > 0) {
            const bank = bankQuery.rows[0];
            profile.bankName = bank.bank_name;
            profile.accountMasked = "XXXXXX" + bank.account_number.slice(-4);
            profile.ifsc = bank.ifsc_code;
          }
        }
      }
    } else if (user.role === "ADMIN") {
      const adminQuery = await pool.query(
        "SELECT * FROM adminprofile WHERE user_id = $1",
        [userId]
      );
      if (adminQuery.rows.length > 0) {
        const admin = adminQuery.rows[0];
        profile.name = admin.full_name;
        profile.department = admin.department;
        profile.designation = admin.designation;
        profile.is_superadmin = admin.is_superadmin;
      }
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProfile(req, res) {
  const { userId } = req.user;
  const updates = req.body;

  try {
    const userUpdates = {};
    if (updates.email) userUpdates.email = updates.email;
    if (updates.phone) userUpdates.phone_number = updates.phone;

    if (Object.keys(userUpdates).length > 0) {
      const setClause = Object.keys(userUpdates)
        .map((k, i) => `${k} = $${i + 1}`)
        .join(", ");
      const values = Object.values(userUpdates);
      await pool.query(
        `UPDATE users SET ${setClause} WHERE user_id = $${values.length + 1}`,
        [...values, userId]
      );
    }

    if (req.user.role === "CUSTOMER") {
      const customerUpdates = {};
      if (updates.name) customerUpdates.full_name = updates.name;
      if (updates.aadhaar) customerUpdates.aadhaar_no = updates.aadhaar;
      if (updates.pan) customerUpdates.pan_no = updates.pan;
      if (updates.employment) customerUpdates.profession = updates.employment;
      if (updates.monthlyIncome)
        customerUpdates.annual_income = parseFloat(updates.monthlyIncome) * 12;
      if (updates.address) customerUpdates.address = updates.address;

      if (Object.keys(customerUpdates).length > 0) {
        const setClause = Object.keys(customerUpdates)
          .map((k, i) => `${k} = $${i + 1}`)
          .join(", ");
        const values = Object.values(customerUpdates);
        await pool.query(
          `UPDATE customerprofile SET ${setClause} WHERE user_id = $${values.length + 1}`,
          [...values, userId]
        );
      }

      if (updates.bankName || updates.ifsc) {
        const customerQuery = await pool.query(
          "SELECT account_id FROM customerprofile WHERE user_id = $1",
          [userId]
        );
        if (
          customerQuery.rows.length > 0 &&
          customerQuery.rows[0].account_id
        ) {
          const accountId = customerQuery.rows[0].account_id;
          const bankUpdates = {};
          if (updates.bankName) bankUpdates.bank_name = updates.bankName;
          if (updates.ifsc) bankUpdates.ifsc_code = updates.ifsc;

          if (Object.keys(bankUpdates).length > 0) {
            const setClause = Object.keys(bankUpdates)
              .map((k, i) => `${k} = $${i + 1}`)
              .join(", ");
            const values = Object.values(bankUpdates);
            await pool.query(
              `UPDATE bank_accounts SET ${setClause} WHERE account_id = $${values.length + 1}`,
              [...values, accountId]
            );
          }
        }
      }
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

