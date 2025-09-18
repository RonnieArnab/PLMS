export const inr = (n) =>
  typeof n === "number" ? Math.round(n).toLocaleString("en-IN") : n;

export const calcEmi = (principal, aprPct, months) => {
  if (!principal || !aprPct || !months) return 0;
  const r = aprPct / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
};

export const calcTotalPayable = (principal, aprPct, months) => {
  const emi = calcEmi(principal, aprPct, months);
  return emi * months;
};

export function toUiLoan(apiLoan) {
  const appliedDate = apiLoan.applied_date
    ? new Date(apiLoan.applied_date)
    : null;
  const approvedDate = apiLoan.approved_date
    ? new Date(apiLoan.approved_date)
    : null;
  const disbursementDate = apiLoan.disbursement_date
    ? new Date(apiLoan.disbursement_date)
    : null;

  console.log("apiLoan", apiLoan);

  // Use backend-calculated values if available, otherwise fall back to local calculations
  const principal = Number(apiLoan.approved_amount || apiLoan.loan_amount);
  const interestRate = Number(apiLoan.interest_rate_apr);
  const months = apiLoan.tenure_months;

  // Use backend-calculated EMI if available, otherwise calculate locally
  const monthlyPayment =
    apiLoan.monthlyPayment || calcEmi(principal, interestRate, months);

  // Calculate total payable amount (principal + interest)
  const totalPayable = calcTotalPayable(principal, interestRate, months);

  // Use backend-calculated remaining balance if available, otherwise calculate from total payable
  const remainingBalance =
    apiLoan.remainingBalance !== undefined
      ? Number(apiLoan.remainingBalance)
      : Math.max(0, totalPayable - (apiLoan.totalRepaid || 0));

  // Use backend-calculated total repaid if available
  const totalRepaid =
    apiLoan.totalRepaid !== undefined ? Number(apiLoan.totalRepaid) : 0;

  // Use backend-calculated next payment date if available
  let nextPaymentDate = apiLoan.nextPaymentDate;
  if (!nextPaymentDate && appliedDate) {
    const today = new Date();
    let monthsElapsed = (today.getFullYear() - appliedDate.getFullYear()) * 12;
    monthsElapsed += today.getMonth() - appliedDate.getMonth();
    if (today.getDate() < appliedDate.getDate()) {
      monthsElapsed -= 1;
    }
    const nextDate = new Date(appliedDate);
    nextDate.setMonth(appliedDate.getMonth() + monthsElapsed + 1);
    nextPaymentDate = nextDate.toISOString();
  }

  // Determine completion status based on remaining balance
  // Allow for small rounding differences (less than 1 rupee)
  const isCompleted =
    apiLoan.isCompleted === true ||
    (apiLoan.remainingBalance !== undefined && apiLoan.remainingBalance <= 1) ||
    remainingBalance <= 1;

  // Use backend-calculated status if available, otherwise determine from application status
  let loanStatus;
  if (apiLoan.status) {
    loanStatus = apiLoan.status;
  } else {
    if (isCompleted) {
      loanStatus = "completed";
    } else if (["APPROVED", "DISBURSED"].includes(apiLoan.application_status)) {
      loanStatus = "active";
    } else if (apiLoan.application_status === "REJECTED") {
      loanStatus = "completed";
    } else {
      // For DRAFT, SUBMITTED, or other statuses - consider active as they're in process
      loanStatus = "active";
    }
  }

  // If backend indicates loan is completed, ensure status is completed
  if (isCompleted) {
    loanStatus = "completed";
  }

  return {
    id: apiLoan.loan_id,
    productId: apiLoan.product_id,
    productName: apiLoan.product_name,
    amount: principal,
    tenureMonths: months,
    interestRate: interestRate,
    status: loanStatus,
    approvedAmount: principal,
    approvedDate: appliedDate,
    disbursementDate: appliedDate,
    monthlyPayment: monthlyPayment,
    totalPayable: totalPayable,
    totalRepaid: totalRepaid,
    remainingBalance: Math.max(0, remainingBalance), // Ensure non-negative
    nextPaymentDate: nextPaymentDate,
    closedDate: apiLoan.closed_date ? new Date(apiLoan.closed_date) : null,
    totalPrincipalPaid: apiLoan.totalPrincipalPaid || 0,
    totalInterestPaid: apiLoan.totalInterestPaid || 0,
    isCompleted: isCompleted,
    paymentCount: apiLoan.paymentCount || 0,
    totalInstallments: apiLoan.totalInstallments || months,
    // Add any other fields your UI expects
  };
}
