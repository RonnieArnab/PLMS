export const inr = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n;

export const calcEmi = (principal, aprPct, months) => {
  if (!principal || !aprPct || !months) return 0;
  const r = aprPct / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
};

export function toUiLoan(apiLoan) {
  console.log(apiLoan);
  const appliedDate = apiLoan.applied_date ? new Date(apiLoan.applied_date) : null;
  
  let nextPaymentDate = null;
  if (appliedDate) {
    const today = new Date();
    let monthsElapsed = (today.getFullYear() - appliedDate.getFullYear()) * 12;
    monthsElapsed += today.getMonth() - appliedDate.getMonth();
    if (today.getDate() < appliedDate.getDate()) {
      monthsElapsed -= 1;
    }
    nextPaymentDate = new Date(appliedDate);
    nextPaymentDate.setMonth(appliedDate.getMonth() + monthsElapsed + 1);
  }

  const principal = Number(apiLoan.loan_amount);
  const interestRate = Number(apiLoan.interest_rate_apr);
  const months = apiLoan.tenure_months;

  const emi = calcEmi(principal, interestRate, months);
  const totalPayable = emi * months;
  const remaining = totalPayable - 0; // Adjust according to repayments if available

  return {
    id: apiLoan.loan_id,
    productId: apiLoan.product_id,
    productName: apiLoan.product_name,
    amount: principal,
    tenureMonths: months,
    interestRate: interestRate,
    status:
      ["APPROVED", "DRAFT", "PENDING"].includes(apiLoan.application_status)
        ? "active"
        : "completed",
    approvedAmount: principal,
    approvedDate: appliedDate,
    disbursementDate: appliedDate,
    monthlyPayment: emi,
    totalRepaid: 0, // If you have this, map it; else, set 0 or null
    remainingBalance: remaining,
    nextPaymentDate:nextPaymentDate ? nextPaymentDate.toISOString() : null,
    closedDate: null,
    // Add any other fields your UI expects
  };
}
