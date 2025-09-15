// export const inr = (n) =>
//   typeof n === "number" ? n.toLocaleString("en-IN") : n;

// export const calcEmi = (principal, aprPct, months) => {
//   if (!principal || !aprPct || !months) return 0;
//   const r = aprPct / 12 / 100;
//   const pow = Math.pow(1 + r, months);
//   return Math.round((principal * r * pow) / (pow - 1));
// };

// export const toUiLoan = (row) => {
//   const principal = row.approved_amount ?? row.loan_amount;
//   const emi = calcEmi(principal, row.interest_rate_apr, row.tenure_months);
//   const isActive = row.disbursement_date && (row.remaining_balance ?? 0) > 0;
//   const isCompleted =
//     row.disbursement_date && (row.remaining_balance ?? 0) === 0;

//   return {
//     id: String(row.loan_id),
//     purpose: row.product_name || "Loan Product",
//     amount: principal,
//     interestRate: row.interest_rate_apr,
//     term: row.tenure_months,
//     monthlyPayment: emi,
//     totalRepaid: row.total_repaid ?? 0,
//     remainingBalance: row.remaining_balance ?? 0,
//     nextPaymentDate: row.next_due_date,
//     disbursedAt: row.disbursement_date,
//     completedAt: row.closed_date || null,
//     status: isCompleted ? "completed" : isActive ? "active" : "pending",
//     _raw: row,
//   };
// };


export const inr = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n;

export const calcEmi = (principal, aprPct, months) => {
  if (!principal || !aprPct || !months) return 0;
  const r = aprPct / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
};

export function toUiLoan(apiLoan) {
  return {
    id: apiLoan.loan_id,
    productId: apiLoan.product_id,
    productName: apiLoan.product_name,
    amount: Number(apiLoan.loan_amount),
    tenureMonths: apiLoan.tenure_months,
    interestRate: Number(apiLoan.interest_rate_apr),
    status:
      ["APPROVED", "DRAFT", "PENDING"].includes(apiLoan.application_status)
        ? "active"
        : "completed", // or use your own logic
    approvedAmount: apiLoan.approved_amount ? Number(apiLoan.approved_amount) : null,
    approvedDate: apiLoan.approved_date,
    disbursementDate: apiLoan.disbursement_date,
    totalRepaid: 0, // If you have this, map it; else, set 0 or null
    remainingBalance: 0, // Same as above
    nextPaymentDate: null, // Same as above
    closedDate: null, // Same as above
    // Add any other fields your UI expects
  };
}