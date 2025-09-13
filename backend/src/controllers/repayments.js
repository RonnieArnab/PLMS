import pool from "../config/db.js";
import { badRequest, serverError } from "./responseHelpers.js";

// Contract:
// - create: POST { loan_id, installment_no, due_date, principal_due?, interest_due? }
// - getByUser: GET /user/:user_id -> list repayment schedule for that user ordered by due_date DESC

export async function getAll(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM repaymentschedule ORDER BY due_date DESC`);
    return res.status(200).json({ status: "success", message: "All repayments fetched", data: result.rows });
  } catch (err) {
    console.error("getAll repayments error:", err);
    return serverError(res, "Unable to fetch repayments");
  }
}

export async function getByUser(req, res) {
  const { user_id } = req.params;
  if (!user_id) return badRequest(res, "Missing user_id param");

  try {
    const q = `SELECT r.* FROM repaymentschedule r JOIN loanapplications l ON r.loan_id = l.loan_id WHERE l.user_id = $1 ORDER BY r.due_date DESC`;
    const result = await pool.query(q, [user_id]);
    return res.status(200).json({ status: "success", message: "Repayment schedule fetched for user", data: result.rows });
  } catch (err) {
    console.error("getByUser repayments error:", err);
    return serverError(res, "Unable to fetch repayments for user");
  }
}

export async function create(req, res) {
  const { loan_id, installment_no, due_date, principal_due, interest_due } = req.body;
  if (!loan_id || installment_no === undefined || !due_date) {
    return badRequest(res, "Required fields: loan_id, installment_no, due_date");
  }

  try {
    const q = `INSERT INTO repaymentschedule (loan_id, installment_no, due_date, principal_due, interest_due) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const values = [loan_id, installment_no, due_date, principal_due || 0, interest_due || 0];
    const result = await pool.query(q, values);
    return res.status(201).json({ status: "success", message: "Repayment scheduled", data: result.rows[0] });
  } catch (err) {
    console.error("create repayment error:", err);
    return serverError(res, "Unable to create repayment schedule");
  }
}

// GET /repayments/loan/:loan_id -> repayments for a loan
export async function getByLoan(req, res) {
  const { loan_id } = req.params;
  if (!loan_id) return badRequest(res, "Missing loan_id param");

  try {
    const q = `SELECT * FROM repaymentschedule WHERE loan_id = $1 ORDER BY due_date DESC`;
    const result = await pool.query(q, [loan_id]);
    return res.status(200).json({ status: "success", message: "Repayment schedule fetched for loan", data: result.rows });
  } catch (err) {
    console.error("getByLoan repayments error:", err);
    return serverError(res, "Unable to fetch repayments for loan");
  }
}
