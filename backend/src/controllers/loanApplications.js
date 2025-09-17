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

// Get all loan applications by user ID with payment calculations
export async function getByUserId(req, res) {
  try {
    const { userId } = req.params;

    // First get the loan applications
    const loansQuery = `
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
    const loansResult = await pool.query(loansQuery, [userId]);

    // For each loan, calculate total paid and remaining balance
    const loansWithPayments = await Promise.all(
      loansResult.rows.map(async (loan) => {
        // Get total payments for this loan
        const paymentsQuery = `
          SELECT
            COALESCE(SUM(amount_paid), 0) as total_paid,
            COALESCE(SUM(allocated_principal), 0) as total_principal_paid,
            COALESCE(SUM(allocated_interest), 0) as total_interest_paid
          FROM payments
          WHERE loan_id = $1
        `;
        const paymentsResult = await pool.query(paymentsQuery, [loan.loan_id]);
        const paymentData = paymentsResult.rows[0];

        // Calculate monthly payment (EMI) first
        const approvedAmount = loan.approved_amount || loan.loan_amount;
        const monthlyPayment = calculateEMI(approvedAmount, loan.interest_rate_apr, loan.tenure_months);

        // Calculate total payable amount (principal + interest)
        const totalPayable = monthlyPayment * loan.tenure_months;

        // Calculate remaining balance based on total payable
        const totalPaid = parseFloat(paymentData.total_paid) || 0;
        const remainingBalance = Math.max(0, totalPayable - totalPaid);

        // Calculate next payment date (only if loan is not completed)
        const nextPaymentDate = remainingBalance > 0 ? calculateNextPaymentDate(loan.approved_date || loan.applied_date) : null;

        // Determine loan status based on remaining balance and application status
        // Allow for small rounding differences (less than 1 rupee)
        const isCompleted = remainingBalance <= 1;
        let loanStatus;

        if (isCompleted) {
          // Loan is fully paid - mark as completed
          loanStatus = "completed";
        } else if (["APPROVED", "DISBURSED"].includes(loan.application_status)) {
          // Loan is approved/disbursted and has remaining balance - active
          loanStatus = "active";
        } else if (loan.application_status === "REJECTED") {
          // Rejected loans should not be active
          loanStatus = "completed";
        } else {
          // For DRAFT, SUBMITTED, or other statuses - consider active as they're in process
          loanStatus = "active";
        }

        // Get payment count for tracking installments
        const paymentCountQuery = `
          SELECT COUNT(*) as payment_count
          FROM payments
          WHERE loan_id = $1 AND amount_paid > 0
        `;
        const paymentCountResult = await pool.query(paymentCountQuery, [loan.loan_id]);
        const paymentCount = parseInt(paymentCountResult.rows[0].payment_count) || 0;

        // Calculate completion date for completed loans
        let completionDate = null;
        if (isCompleted && paymentCount > 0) {
          // Find the payment that made the balance go to zero or below
          const completionQuery = `
            SELECT payment_date
            FROM payments
            WHERE loan_id = $1 AND amount_paid > 0
            ORDER BY payment_date DESC
          `;
          const completionResult = await pool.query(completionQuery, [loan.loan_id]);

          if (completionResult.rows.length > 0) {
            // Calculate running balance to find completion payment
            let runningBalance = totalPayable;
            for (const payment of completionResult.rows.reverse()) { // Process in chronological order
              const paymentAmount = parseFloat(payment.amount_paid || 0);
              runningBalance -= paymentAmount;
              if (runningBalance <= 0) {
                completionDate = payment.payment_date;
                break;
              }
            }
          }
        }

        return {
          ...loan,
          // Override approved_date and disbursement_date to show applied_date
          approved_date: loan.applied_date,
          disbursement_date: loan.applied_date,
          totalRepaid: totalPaid,
          totalPayable: totalPayable,
          remainingBalance: remainingBalance,
          monthlyPayment: monthlyPayment,
          nextPaymentDate: nextPaymentDate,
          totalPrincipalPaid: parseFloat(paymentData.total_principal_paid) || 0,
          totalInterestPaid: parseFloat(paymentData.total_interest_paid) || 0,
          status: loanStatus,
          isCompleted: isCompleted,
          paymentCount: paymentCount,
          totalInstallments: loan.tenure_months,
          completionDate: completionDate
        };
      })
    );

    res.json({ success: true, data: loansWithPayments, count: loansWithPayments.length });
  } catch (error) {
    console.error('Error fetching user loans with payments:', error);
    res.status(500).json({ success: false, message: "Error fetching user's loan applications", error: error.message });
  }
}

// Helper function to calculate EMI
function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100; // Round to 2 decimal places
}

// Helper function to calculate next payment date
function calculateNextPaymentDate(approvedDate) {
  if (!approvedDate) return null;

  const approved = new Date(approvedDate);
  const now = new Date();

  // If approved date is in the future, use it as base
  // Otherwise, use current date as base
  const baseDate = approved > now ? approved : now;

  // Calculate next payment date (typically monthly payments)
  // Add one month to the base date
  const nextPaymentDate = new Date(baseDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  // Set to first day of the month for consistency
  nextPaymentDate.setDate(1);

  return nextPaymentDate.toISOString();
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
