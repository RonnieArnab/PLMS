// export async function getAll(req, res) {
//   res.json({ service: "loanApplications", action: "getAll" });
// }

// export async function create(req, res) {
//   res.json({ service: "loanApplications", action: "create", data: req.body });
// }


import pool from "../config/db.js";
// import db from "../db.js";
// 
// Get all loan applications with user and product info
export async function getAll(req, res) {
  try {
    const query = `
      SELECT 
        la.loan_id, la.user_id, u.email, c.full_name, c.profession,
        la.product_id, lp.name AS product_name, lp.target_profession,
        la.loan_amount, la.tenure_months, la.application_status, 
        la.approved_amount, la.interest_rate_apr, la.processing_fee,
        la.risk_grade, la.applied_date, la.approved_date, la.disbursement_date
      FROM loanapplications la
      JOIN users u ON la.user_id = u.user_id
      JOIN customerprofile c ON u.user_id = c.user_id
      JOIN loanproducts lp ON la.product_id = lp.product_id
      ORDER BY la.applied_date DESC
    `;
    const result = await pool.query(query);

    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching loan applications", error: error.message });
  }
}

// Get loan application by ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        la.loan_id, la.user_id, u.email, c.full_name, c.profession,
        la.product_id, lp.name AS product_name, lp.target_profession,
        la.loan_amount, la.tenure_months, la.application_status, 
        la.approved_amount, la.interest_rate_apr, la.processing_fee,
        la.risk_grade, la.applied_date, la.approved_date, la.disbursement_date
      FROM loanapplications la
      JOIN users u ON la.user_id = u.user_id
      JOIN customerprofile c ON u.user_id = c.user_id
      JOIN loanproducts lp ON la.product_id = lp.product_id
      WHERE la.loan_id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching loan application", error: error.message });
  }
}

// Get all loan applications by user ID
export async function getByUserId(req, res) {
  try {
    const { userId } = req.params;
    const query = `
      SELECT 
        la.loan_id, la.user_id, u.email, c.full_name, c.profession,
        la.product_id, lp.name AS product_name, lp.target_profession,
        la.loan_amount, la.tenure_months, la.application_status, 
        la.approved_amount, la.interest_rate_apr, la.processing_fee,
        la.risk_grade, la.applied_date, la.approved_date, la.disbursement_date
      FROM loanapplications la
      JOIN users u ON la.user_id = u.user_id
      JOIN customerprofile c ON u.user_id = c.user_id
      JOIN loanproducts lp ON la.product_id = lp.product_id
      WHERE la.user_id = $1
      ORDER BY la.applied_date DESC
    `;
    const result = await pool.query(query, [userId]);

    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user's loan applications", error: error.message });
  }
}
// Create or update customer profile
// Create a new loan application
export async function create(req, res) {
  try {
    const { user_id, product_id, loan_amount, tenure_months, application_status = "DRAFT", approved_amount, interest_rate_apr, processing_fee, risk_grade } = req.body;

    // if (!user_id || !product_id || !loan_amount || !tenure_months) {
    //   return res.status(400).json({ success: false, message: "Missing required fields" });
    // }

    const query = `
      INSERT INTO loanapplications
        (user_id, product_id, loan_amount, tenure_months, application_status, approved_amount, interest_rate_apr, processing_fee, risk_grade)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [user_id, product_id, loan_amount, tenure_months, application_status, approved_amount, interest_rate_apr, processing_fee, risk_grade];
    const result = await pool.query(query, values);

    res.status(201).json({ success: true, message: "Loan application created", data: result.rows[0] });
  } catch (error) {
    console.error("Error in create loan application:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update loan application
export async function update(req, res) {
  try {
    const { id } = req.params;
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
    const query = `UPDATE loanapplications SET ${setClause} WHERE loan_id = $${fields.length + 1} RETURNING *`;

    const result = await pool.query(query, [...values, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }

    res.json({ success: true, message: "Loan application updated", data: result.rows[0] });
  } catch (error) {
    console.error("Error in create loan application:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Delete loan application
export async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM loanapplications WHERE loan_id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }

    res.json({ success: true, message: "Loan application deleted", data: result.rows[0] });
  } catch (error) {
    console.error("Error in create loan application:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Create or update customer profile
export async function upsertCustomerProfile(req, res) {
  try {
    const {
      user_id,
      full_name,
      aadhaar_no,
      pan_no,
      profession,
      years_experience,
      annual_income,
      kyc_status,
      address,
    } = req.body;

    // Upsert logic: insert if not exists, else update
    const result = await pool.query(
      `
      INSERT INTO customerprofile
        (user_id, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, kyc_status, address)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        aadhaar_no = EXCLUDED.aadhaar_no,
        pan_no = EXCLUDED.pan_no,
        profession = EXCLUDED.profession,
        years_experience = EXCLUDED.years_experience,
        annual_income = EXCLUDED.annual_income,
        kyc_status = EXCLUDED.kyc_status,
        address = EXCLUDED.address
      RETURNING *;
      `,
      [
        user_id,
        full_name,
        aadhaar_no,
        pan_no,
        profession,
        years_experience,
        annual_income,
        kyc_status,
        address,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error upserting customer profile:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}


