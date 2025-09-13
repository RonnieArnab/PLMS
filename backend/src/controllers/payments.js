// payments controller - clean implementation
import pool from '../config/db.js';
import { badRequest, serverError } from './responseHelpers.js';

// POST /payments -> create payment
// Body: { amount, user_id, loan_id, instalment_id?, method?, transaction_reference? }
export async function create(req, res) {
  const { amount, user_id, loan_id, instalment_id, method, transaction_reference } = req.body;

  if (amount === undefined || !user_id || !loan_id) {
    return badRequest(res, 'Required fields: amount, user_id, loan_id');
  }

  try {
    const q = `INSERT INTO payments (repayment_id, loan_id, payer_user_id, amount_paid, payment_method, transaction_reference) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const values = [instalment_id || null, loan_id, user_id, amount, method || null, transaction_reference || null];
    const result = await pool.query(q, values);
    return res.status(201).json({ status: 'success', message: 'Payment created', data: result.rows[0] });
  } catch (err) {
    console.error('create payment error:', err);
    return serverError(res, 'Unable to create payment');
  }
}

// GET /payments -> all payments (admin)
export async function getAll(req, res) {
  try {
    const result = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
    return res.status(200).json({ status: 'success', message: 'All payments fetched', data: result.rows });
  } catch (err) {
    console.error('getAll payments error:', err);
    return serverError(res, 'Unable to fetch payments');
  }
}

// GET /payments/user/:user_id -> payments for a user
export async function getByUser(req, res) {
  const { user_id } = req.params;
  if (!user_id) return badRequest(res, 'Missing user_id param');

  try {
    const q = `SELECT p.*,
             u.email as payer_email,
             u.phone_number as payer_phone,
             c.full_name as payer_name,
             c.address as payer_address,
             c.date_of_birth as date_of_birth,
             c.aadhaar_no,
             c.pan_no,
             b.bank_name,
             b.account_number,
             b.account_type
      FROM payments p
      LEFT JOIN users u ON p.payer_user_id = u.user_id
      LEFT JOIN customerprofile c ON p.payer_user_id = c.user_id
      LEFT JOIN bank_accounts b ON c.account_id = b.account_id
      WHERE p.payer_user_id = $1
      ORDER BY p.payment_date DESC
    `;
    const result = await pool.query(q, [user_id]);

    // Format the response to include complete payer profile details
    const paymentsWithPayer = result.rows.map(payment => ({
      ...payment,
      payer: {
        name: payment.payer_name || 'Customer',
        email: payment.payer_email || 'customer@example.com',
        phone: payment.payer_phone || '',
        address: payment.payer_address || '',
        account_number: payment.account_number || ''
      },
      profile: {
        full_name: payment.payer_name,
        phone: payment.payer_phone,
        email: payment.payer_email,
        address: payment.payer_address,
        date_of_birth: payment.date_of_birth ? new Date(payment.date_of_birth).toLocaleDateString("en-IN") : null,
        account_number: payment.account_number,
        bank_name: payment.bank_name,
        account_type: payment.account_type
      }
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Payments fetched for user',
      data: paymentsWithPayer
    });
  } catch (err) {
    console.error('getByUser payments error:', err);
    return serverError(res, 'Unable to fetch payments for user');
  }
}

// GET /payments/loan/:loan_id -> payments for a loan
export async function getByLoan(req, res) {
  const { loan_id } = req.params;
  if (!loan_id) return badRequest(res, 'Missing loan_id param');

  try {
    const q = `SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC`;
    const result = await pool.query(q, [loan_id]);
    return res.status(200).json({ status: 'success', message: 'Payments fetched for loan', data: result.rows });
  } catch (err) {
    console.error('getByLoan payments error:', err);
    return serverError(res, 'Unable to fetch payments for loan');
  }
}
// Additional endpoints like update or delete can be added as needed
// Future enhancements: pagination, filtering by date range, exporting payment data, etc.

// Note: Ensure proper authentication and authorization in actual implementation