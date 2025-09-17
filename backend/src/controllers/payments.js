import Razorpay from "razorpay";
import crypto from "crypto";
import pool from "../config/db.js";
import { env } from "../config/env.js";
import { generateComprehensiveReport } from "../utils/excelUtils.js";

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret
});

// Get payments by user ID
export const getPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching payments for user:', userId);

    // First check if user exists
    const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const query = `
      SELECT
        p.payment_id as id,
        p.loan_id,
        p.amount_paid as amount,
        p.payment_date,
        p.payment_method,
        p.transaction_reference as transaction_ref,
        'completed' as status,
        p.payment_type,
        CASE
          WHEN p.allocated_principal > 0 THEN p.allocated_principal
          WHEN p.repayment_id IS NOT NULL THEN r.principal_due
          WHEN p.loan_id IS NOT NULL THEN
            -- Calculate principal as 80% of payment for loan payments without specific allocation
            ROUND(p.amount_paid * 0.8, 2)
          ELSE 0
        END as principal,
        CASE
          WHEN p.allocated_interest > 0 THEN p.allocated_interest
          WHEN p.repayment_id IS NOT NULL THEN r.interest_due
          WHEN p.loan_id IS NOT NULL THEN
            -- Calculate interest as 20% of payment for loan payments without specific allocation
            ROUND(p.amount_paid * 0.2, 2)
          ELSE 0
        END as interest
      FROM payments p
      LEFT JOIN repaymentschedule r ON p.repayment_id = r.repayment_id
      WHERE p.payer_user_id = $1
      ORDER BY p.payment_date DESC
    `;
    const result = await pool.query(query, [userId]);
    console.log('Payments fetched:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, error: "Failed to fetch payments", details: err.message });
  }
};

// Get payments by loan ID
export const getPaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const query = `
      SELECT
        p.payment_id as id,
        p.payer_user_id as user_id,
        p.amount_paid as amount,
        p.payment_date,
        p.payment_method,
        p.transaction_reference as transaction_ref,
        'completed' as status,
        CASE
          WHEN p.allocated_principal > 0 THEN p.allocated_principal
          WHEN p.repayment_id IS NOT NULL THEN r.principal_due
          WHEN p.loan_id IS NOT NULL THEN
            -- Calculate principal as 80% of payment for loan payments without specific allocation
            ROUND(p.amount_paid * 0.8, 2)
          ELSE 0
        END as principal,
        CASE
          WHEN p.allocated_interest > 0 THEN p.allocated_interest
          WHEN p.repayment_id IS NOT NULL THEN r.interest_due
          WHEN p.loan_id IS NOT NULL THEN
            -- Calculate interest as 20% of payment for loan payments without specific allocation
            ROUND(p.amount_paid * 0.2, 2)
          ELSE 0
        END as interest
      FROM payments p
      LEFT JOIN repaymentschedule r ON p.repayment_id = r.repayment_id
      WHERE p.loan_id = $1
      ORDER BY p.payment_date DESC
    `;
    const result = await pool.query(query, [loanId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
};

// Record a payment
export const recordPayment = async (req, res) => {
  try {
    console.log('Recording payment:', req.body);
    const { user_id, loan_id, amount, payment_method, transaction_ref } = req.body;

    // Validate required fields
    if (!user_id || !amount || !payment_method || !transaction_ref) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user_id, amount, payment_method, transaction_ref"
      });
    }

    // First, check if user exists
    const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "User not found"
      });
    }

    // If loan_id is null, try to find the most recent active loan for this user
    let finalLoanId = loan_id;
    if (!loan_id && user_id) {
      const loanQuery = `
        SELECT loan_id FROM loanapplications
        WHERE user_id = $1 AND application_status IN ('APPROVED', 'DISBURSED')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const loanResult = await pool.query(loanQuery, [user_id]);
      if (loanResult.rows.length > 0) {
        finalLoanId = loanResult.rows[0].loan_id;
      }
    }

    // If still no loan_id, create a standalone payment (without loan reference)
    if (!finalLoanId) {
      console.log('No loan found, creating standalone payment');
      const query = `
        INSERT INTO payments (payer_user_id, amount_paid, payment_method, transaction_reference, payment_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING payment_id as id, loan_id, amount_paid as amount, payment_date, payment_method, transaction_reference as transaction_ref, allocated_principal as principal, allocated_interest as interest
      `;
      const result = await pool.query(query, [user_id, amount, payment_method, transaction_ref, 'GENERAL']);
      console.log('Standalone payment recorded successfully:', result.rows[0]);
      res.json({ success: true, data: result.rows[0] });
    } else {
      // Calculate payment allocations for the loan
      let allocatedPrincipal = 0;
      let allocatedInterest = 0;

      // Get loan details to calculate allocations
      const loanQuery = `
        SELECT la.approved_amount, la.interest_rate_apr, la.tenure_months,
               COALESCE(SUM(p.amount_paid), 0) as total_paid
        FROM loanapplications la
        LEFT JOIN payments p ON la.loan_id = p.loan_id
        WHERE la.loan_id = $1
        GROUP BY la.loan_id, la.approved_amount, la.interest_rate_apr, la.tenure_months
      `;
      const loanResult = await pool.query(loanQuery, [finalLoanId]);

      if (loanResult.rows.length > 0) {
        const loan = loanResult.rows[0];
        const approvedAmount = parseFloat(loan.approved_amount || loan.loan_amount);
        const totalPaid = parseFloat(loan.total_paid);
        const remainingBalance = Math.max(0, approvedAmount - totalPaid);

        // Simple allocation: 80% to principal, 20% to interest
        allocatedPrincipal = Math.min(remainingBalance, amount * 0.8);
        allocatedInterest = amount - allocatedPrincipal;
      }

      // Insert with loan reference and allocations
      const query = `
        INSERT INTO payments (loan_id, payer_user_id, amount_paid, payment_method, transaction_reference, allocated_principal, allocated_interest)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING payment_id as id, loan_id, amount_paid as amount, payment_date, payment_method, transaction_reference as transaction_ref, allocated_principal as principal, allocated_interest as interest
      `;
      const result = await pool.query(query, [finalLoanId, user_id, amount, payment_method, transaction_ref, allocatedPrincipal, allocatedInterest]);
      console.log('Payment recorded successfully:', result.rows[0]);
      res.json({ success: true, data: result.rows[0] });
    }
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ success: false, error: "Failed to record payment", details: err.message });
  }
};

// One-time order
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // in INR
    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: "order_rcptid_" + Date.now()
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
};

// Subscription (Autopay)
export const createSubscription = async (req, res) => {
  try {
    const { planId, totalCount } = req.body;
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId, // plan must be created in dashboard (test mode)
      customer_notify: 1,
      total_count: totalCount || 12, // e.g., 12 months
      start_at: Math.floor(Date.now() / 1000) + 60 // start after 1 min
    });
    res.json(subscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription creation failed" });
  }
};

// Verify payment signature and record in database
export const verifyPayment = async (req, res) => {
  try {
    console.log('=== VERIFY PAYMENT START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, loan_id, payer_user_id } = req.body;

    console.log('Extracted fields:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature ? 'present' : 'missing',
      loan_id,
      payer_user_id
    });

    // Validate required fields (loan_id can be null, but other fields are required)
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payer_user_id) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        ok: false,
        msg: "Missing required fields",
        missing: {
          razorpay_order_id: !razorpay_order_id,
          razorpay_payment_id: !razorpay_payment_id,
          razorpay_signature: !razorpay_signature,
          payer_user_id: !payer_user_id
        }
      });
    }

    console.log('✅ All required fields present');

    // Verify signature
    console.log('🔐 Verifying signature...');
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(sign.toString())
      .digest("hex");

    console.log('Signature check:', {
      provided: razorpay_signature,
      expected: expectedSign,
      match: razorpay_signature === expectedSign
    });

    if (razorpay_signature !== expectedSign) {
      console.log('❌ Signature verification failed');
      return res.status(400).json({ ok: false, msg: "Invalid signature" });
    }

    console.log('✅ Signature verified successfully');

    // Fetch payment details from Razorpay
    console.log('📡 Fetching payment details from Razorpay...');
    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log('✅ Payment details fetched:', {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method
      });
    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', razorpayError);
      return res.status(500).json({
        ok: false,
        msg: "Failed to fetch payment from Razorpay",
        error: razorpayError.message
      });
    }

    // Calculate payment allocations if loan_id is provided
    let allocatedPrincipal = 0;
    let allocatedInterest = 0;
    const paymentAmount = (payment.amount / 100).toFixed(2);

    if (loan_id) {
      // Get loan details to calculate allocations
      const loanQuery = `
        SELECT la.approved_amount, la.interest_rate_apr, la.tenure_months,
               COALESCE(SUM(p.amount_paid), 0) as total_paid
        FROM loanapplications la
        LEFT JOIN payments p ON la.loan_id = p.loan_id
        WHERE la.loan_id = $1
        GROUP BY la.loan_id, la.approved_amount, la.interest_rate_apr, la.tenure_months
      `;
      const loanResult = await pool.query(loanQuery, [loan_id]);

      if (loanResult.rows.length > 0) {
        const loan = loanResult.rows[0];
        const approvedAmount = parseFloat(loan.approved_amount || loan.loan_amount);
        const totalPaid = parseFloat(loan.total_paid);
        const remainingBalance = Math.max(0, approvedAmount - totalPaid);

        // Simple allocation: 80% to principal, 20% to interest (can be improved with proper EMI calculation)
        allocatedPrincipal = Math.min(remainingBalance, paymentAmount * 0.8);
        allocatedInterest = paymentAmount - allocatedPrincipal;
      }
    }

    // Insert into payments table
    console.log('💾 Inserting payment into database...');
    const insertQuery = `
      INSERT INTO payments (
        loan_id, payer_user_id, amount_paid, payment_method, payment_type, transaction_reference,
        allocated_principal, allocated_interest
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      loan_id || null, // Use null instead of hardcoded UUID
      payer_user_id,
      paymentAmount, // convert paise → INR
      payment.method,
      "RAZORPAY",
      payment.id,
      allocatedPrincipal,
      allocatedInterest
    ];

    console.log('Insert values:', values);

    let result;
    try {
      result = await pool.query(insertQuery, values);
      console.log('✅ Database insertion successful');
    } catch (dbError) {
      console.error('❌ Database insertion error:', dbError);
      return res.status(500).json({
        ok: false,
        msg: "Failed to save payment to database",
        error: dbError.message,
        code: dbError.code
      });
    }

    const insertedPayment = result.rows[0];
    console.log('✅ Payment verification and recording successful:', insertedPayment);
    console.log('=== VERIFY PAYMENT END ===');

    res.json({ ok: true, payment: insertedPayment });
  } catch (err) {
    console.error('💥 Unexpected error in verifyPayment:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({
      ok: false,
      msg: "Unexpected error during payment verification",
      error: err.message,
      stack: err.stack
    });
  }
};

// Get payment history for a loan
export const getPaymentHistory = async (req, res) => {
  try {
    const { loan_id } = req.query;

    if (!loan_id) {
      return res.status(400).json({ ok: false, msg: "loan_id required" });
    }

    const result = await pool.query(
      `SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC`,
      [loan_id]
    );

    return res.json({ ok: true, payments: result.rows });
  } catch (err) {
    console.error("Fetch payment history error:", err);
    res.status(500).json({ ok: false, msg: "Server error" });
  }
};

// Verify subscription signature
export const verifySubscription = async (req, res) => {
  try {
    const { subscription_id, payment_id, signature } = req.body;
    const sign = subscription_id + "|" + payment_id;
    const expectedSign = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(sign.toString())
      .digest("hex");

    if (signature === expectedSign) {
      res.json({ ok: true, message: "Subscription verified successfully" });
    } else {
      res.status(400).json({ ok: false, error: "Subscription verification failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Verification error" });
  }
};

// Export payment statements to Excel
export const exportPaymentStatements = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Exporting payment statements for user:', userId);

    // First check if user exists and get their profile information
    const userCheck = await pool.query(`
      SELECT u.user_id, u.email, cp.full_name
      FROM users u
      LEFT JOIN customerprofile cp ON u.user_id = cp.user_id
      WHERE u.user_id = $1
    `, [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = userCheck.rows[0];

    // Get all payments for the user
    const paymentsQuery = `
      SELECT
        p.payment_id,
        p.loan_id,
        p.amount_paid,
        p.payment_date,
        p.payment_method,
        p.transaction_reference,
        p.payment_type,
        p.allocated_principal,
        p.allocated_interest,
        p.repayment_id,
        r.installment_no,
        r.total_due as scheduled_installment_amount
      FROM payments p
      LEFT JOIN repaymentschedule r ON p.repayment_id = r.repayment_id
      WHERE p.payer_user_id = $1
      ORDER BY p.payment_date DESC
    `;

    const paymentsResult = await pool.query(paymentsQuery, [userId]);
    const payments = paymentsResult.rows;

    // Get loan summary information with product names
    const loansQuery = `
      SELECT
        la.loan_id,
        la.loan_amount,
        la.approved_amount,
        la.interest_rate_apr,
        la.tenure_months,
        la.application_status,
        la.created_at,
        la.disbursement_date,
        lp.name as product_name
      FROM loanapplications la
      LEFT JOIN loanproducts lp ON la.product_id = lp.product_id
      WHERE la.user_id = $1
      ORDER BY la.created_at DESC
    `;

    const loansResult = await pool.query(loansQuery, [userId]);
    const loans = loansResult.rows;

    // Get upcoming payments (repayment schedule)
    const upcomingQuery = `
      SELECT
        r.loan_id,
        r.due_date,
        r.total_due as amount,
        r.status
      FROM repaymentschedule r
      JOIN loanapplications la ON r.loan_id = la.loan_id
      WHERE la.user_id = $1 AND r.due_date >= CURRENT_DATE
      ORDER BY r.due_date ASC
    `;

    const upcomingResult = await pool.query(upcomingQuery, [userId]);
    const upcomingPayments = upcomingResult.rows;

    // Generate Excel file using the utility
    const excelBuffer = await generateComprehensiveReport({
      user,
      loans,
      payments,
      upcomingPayments
    });

    // Generate filename with user info and date
    const currentDate = new Date().toISOString().split('T')[0];
    const userName = user.full_name ? user.full_name.replace(/\s+/g, '_') : 'User';
    const filename = `Loan_Payments_${userName}_${currentDate}.xlsx`;

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the Excel buffer
    res.send(excelBuffer);

    console.log(`Excel file generated successfully for user ${userId}: ${filename}`);

  } catch (err) {
    console.error('Error exporting payment statements:', err);
    res.status(500).json({
      success: false,
      error: "Failed to export payment statements",
      details: err.message
    });
  }
};
