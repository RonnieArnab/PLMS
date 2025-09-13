import { body, validationResult } from 'express-validator';

export const validatePaymentCreate = [
  body('amount').exists().withMessage('amount is required').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
  body('user_id').exists().withMessage('user_id is required').isUUID().withMessage('user_id must be a valid UUID'),
  body('loan_id').exists().withMessage('loan_id is required').isUUID().withMessage('loan_id must be a valid UUID'),
  body('repayment_id').optional().isUUID().withMessage('repayment_id must be a valid UUID'),
  // final handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', message: 'Validation failed', data: errors.array() });
    next();
  },
];

export const validateRepaymentCreate = [
  body('loan_id').exists().withMessage('loan_id is required').isUUID().withMessage('loan_id must be a valid UUID'),
  body('installment_no').exists().withMessage('installment_no is required').isInt({ gt: 0 }).withMessage('installment_no must be a positive integer'),
  body('due_date').exists().withMessage('due_date is required').isISO8601().withMessage('due_date must be a valid ISO date'),
  body('principal_due').optional().isFloat({ min: 0 }).withMessage('principal_due must be a non-negative number'),
  body('interest_due').optional().isFloat({ min: 0 }).withMessage('interest_due must be a non-negative number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', message: 'Validation failed', data: errors.array() });
    next();
  },
];
