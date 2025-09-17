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

// GET /repayments/next/:loan_id -> next upcoming repayment for a loan
export async function getNext(req, res) {
  const { loan_id } = req.params;
  if (!loan_id) return badRequest(res, "Missing loan_id param");

  try {
    // First check if repayment schedule exists
    const existingScheduleQuery = `SELECT COUNT(*) as count FROM repaymentschedule WHERE loan_id = $1`;
    const existingScheduleResult = await pool.query(existingScheduleQuery, [loan_id]);
    const scheduleExists = parseInt(existingScheduleResult.rows[0].count) > 0;

    if (!scheduleExists) {
      // Check if loan is active (approved/disbursted and not completed) and generate schedule if needed
      const loanQuery = `
        SELECT la.loan_id, la.approved_amount, la.interest_rate_apr, la.tenure_months,
               la.disbursement_date, la.application_status,
               COALESCE(SUM(p.amount_paid), 0) as total_paid
        FROM loanapplications la
        LEFT JOIN payments p ON la.loan_id = p.loan_id
        WHERE la.loan_id = $1 AND la.application_status IN ('APPROVED', 'DISBURSED')
        GROUP BY la.loan_id, la.approved_amount, la.interest_rate_apr, la.tenure_months,
                 la.disbursement_date, la.application_status
      `;
      const loanResult = await pool.query(loanQuery, [loan_id]);

      if (loanResult.rows.length > 0) {
        const loan = loanResult.rows[0];
        const remainingBalance = loan.approved_amount - loan.total_paid;

        // Only generate schedule if loan is not completed
        if (remainingBalance > 0) {
          // Generate repayment schedule
          await generateRepaymentSchedule(loan);

          console.log(`Generated repayment schedule for loan: ${loan_id}`);
        }
      }
    }

    // Now fetch the next repayment
    const q = `SELECT * FROM repaymentschedule WHERE loan_id = $1 AND due_date >= CURRENT_DATE ORDER BY due_date ASC LIMIT 1`;
    const result = await pool.query(q, [loan_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "No upcoming repayments found for this loan" });
    }

    return res.status(200).json({
      status: "success",
      message: "Next repayment fetched",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("getNext repayment error:", err);
    return serverError(res, "Unable to fetch next repayment");
  }
}

// Helper function to generate repayment schedule
async function generateRepaymentSchedule(loanData) {
  const {
    loan_id,
    approved_amount,
    interest_rate_apr,
    tenure_months,
    disbursement_date
  } = loanData;

  if (!loan_id || !approved_amount || !interest_rate_apr || !tenure_months) {
    throw new Error('Loan data incomplete for schedule generation');
  }

  const principal = approved_amount;
  const monthlyRate = interest_rate_apr / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) /
              (Math.pow(1 + monthlyRate, tenure_months) - 1);

  const schedule = [];
  let remainingBalance = principal;
  let startDate = disbursement_date ? new Date(disbursement_date) : new Date();

  // Set to next month for first payment
  startDate.setMonth(startDate.getMonth() + 1);
  startDate.setDate(1); // First day of the month

  for (let i = 1; i <= tenure_months; i++) {
    const interestDue = remainingBalance * monthlyRate;
    const principalDue = emi - interestDue;

    schedule.push({
      loan_id,
      installment_no: i,
      due_date: startDate.toISOString().split('T')[0],
      principal_due: Math.round(principalDue * 100) / 100,
      interest_due: Math.round(interestDue * 100) / 100,
      total_due: Math.round(emi * 100) / 100,
      status: 'PENDING'
    });

    remainingBalance -= principalDue;
    startDate.setMonth(startDate.getMonth() + 1);
  }

  // Insert all schedule entries
  for (const entry of schedule) {
    const insertQuery = `
      INSERT INTO repaymentschedule (loan_id, installment_no, due_date, principal_due, interest_due, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      entry.loan_id,
      entry.installment_no,
      entry.due_date,
      entry.principal_due,
      entry.interest_due,
      entry.status
    ];

    await pool.query(insertQuery, values);
  }
}
