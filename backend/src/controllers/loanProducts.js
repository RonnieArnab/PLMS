// export async function getAll(req, res) {
//   res.json({ service: "loanProducts", action: "getAll" });
// }

// export async function create(req, res) {
//   res.json({ service: "loanProducts", action: "create", data: req.body });
// }


import pool from "../config/db.js";

// ✅ Get all products
export async function getAll(req, res) {
  try {
    const result = await pool.query("SELECT * FROM loanproducts");
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch loan products", error: error.message });
  }
}

// ✅ Get product by ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM loanproducts WHERE product_id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Loan product not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch loan product", error: error.message });
  }
}

// ✅ Create new product
export async function create(req, res) {
  try {
    const { name, target_profession, min_amount, max_amount, min_tenure, max_tenure, base_interest_apr, processing_fee_pct, prepayment_allowed } = req.body;

    const result = await pool.query(
      `INSERT INTO loanproducts  
        (name, target_profession, min_amount, max_amount, min_tenure, max_tenure, base_interest_apr, processing_fee_pct, prepayment_allowed) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, target_profession, min_amount, max_amount, min_tenure, max_tenure, base_interest_apr, processing_fee_pct, prepayment_allowed]
    );

    res.status(201).json({ success: true, message: "Loan product created successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create loan product", error: error.message });
  }
}

// ✅ Update product
export async function update(req, res) {
  try {
    const { id } = req.params;
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
    const result = await pool.query(
      `UPDATE loanproducts SET ${setQuery} WHERE product_id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Loan product not found" });
    res.json({ success: true, message: "Loan product updated successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update loan product", error: error.message });
  }
}

// ✅ Delete product (Hard delete, since there's no is_active column)
export async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM loanproducts WHERE product_id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Loan product not found" });
    res.json({ success: true, message: "Loan product deleted successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete loan product", error: error.message });
  }
}