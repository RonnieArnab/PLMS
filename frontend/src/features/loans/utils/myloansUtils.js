export const inr = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n;

export const calcEmi = (principal, aprPct, months) => {
  if (!principal || !aprPct || !months) return 0;
  const r = aprPct / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
};

export const toUiLoan = (row) => {
  const principal = row.approved_amount ?? row.loan_amount;
  const emi = calcEmi(principal, row.interest_rate_apr, row.tenure_months);
  const isActive = row.disbursement_date && (row.remaining_balance ?? 0) > 0;
  const isCompleted =
    row.disbursement_date && (row.remaining_balance ?? 0) === 0;

  return {
    id: String(row.loan_id),
    purpose: row.product_name || "Loan Product",
    amount: principal,
    interestRate: row.interest_rate_apr,
    term: row.tenure_months,
    monthlyPayment: emi,
    totalRepaid: row.total_repaid ?? 0,
    remainingBalance: row.remaining_balance ?? 0,
    nextPaymentDate: row.next_due_date,
    disbursedAt: row.disbursement_date,
    completedAt: row.closed_date || null,
    status: isCompleted ? "completed" : isActive ? "active" : "pending",
    _raw: row,
  };
};
