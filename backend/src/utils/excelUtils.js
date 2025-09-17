import ExcelJS from "exceljs";

/**
 * Generate Excel file for loan payments with comprehensive data
 * @param {Object} data - Contains user info, loans, payments, and upcoming payments
 * @returns {Buffer} Excel file buffer
 */
export const generateLoanPaymentsExcel = async (data) => {
  const { user, loans, payments, upcomingPayments } = data;

  const workbook = new ExcelJS.Workbook();

  // Add title and metadata
  workbook.creator = 'Loan Management System';
  workbook.created = new Date();

  // Main worksheet for loan payments
  const worksheet = workbook.addWorksheet("Loan Payments");

  // Define columns
  worksheet.columns = [
    { header: "Loan ID", key: "loan_id", width: 20 },
    { header: "Name", key: "name", width: 25 },
    { header: "Loan Type", key: "loan_type", width: 20 },
    { header: "Loan Amount", key: "loan_amount", width: 15 },
    { header: "Loan Amount Remaining", key: "remaining_amount", width: 25 },
    { header: "Status", key: "status", width: 15 },
    { header: "Completion Date", key: "completion_date", width: 18 },
    { header: "Payment Dates", key: "payment_dates", width: 40 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' } // Light lavender
  };

  // Process each loan
  loans.forEach((loan) => {
    // Get payments for this loan
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    const totalPaid = loanPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);

    // Calculate EMI and total payable (including interest) like in MyLoans.jsx
    const principal = parseFloat(loan.approved_amount || loan.loan_amount || 0);
    const interestRate = parseFloat(loan.interest_rate_apr || 0);
    const months = parseInt(loan.tenure_months || 0);

    let emi = 0;
    let totalPayable = principal;
    if (principal > 0 && interestRate > 0 && months > 0) {
      const r = interestRate / 12 / 100;
      const pow = Math.pow(1 + r, months);
      emi = Math.round((principal * r * pow) / (pow - 1));
      totalPayable = emi * months;
    }

    // Calculate remaining amount properly
    const remainingAmount = Math.max(0, totalPayable - totalPaid);

    // Determine loan status and completion date
    let loanStatus = 'Active';
    let completionDate = null;

    if (remainingAmount <= 0 && loanPayments.length > 0) {
      loanStatus = 'Completed';

      // Find the completion date (payment that made balance go to zero or below)
      let runningBalance = totalPayable;
      const sortedPayments = [...loanPayments].sort((a, b) =>
        new Date(a.payment_date) - new Date(b.payment_date)
      );

      for (const payment of sortedPayments) {
        const paymentAmount = parseFloat(payment.amount_paid || 0);
        runningBalance -= paymentAmount;
        if (runningBalance <= 0) {
          completionDate = new Date(payment.payment_date).toLocaleDateString('en-IN');
          break;
        }
      }
    } else if (loan.application_status === 'REJECTED') {
      loanStatus = 'Rejected';
    } else if (loan.application_status === 'DRAFT' || loan.application_status === 'SUBMITTED') {
      loanStatus = 'Pending Approval';
    }

    // Get payment dates
    const paymentDates = loanPayments
      .map(p => p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : 'N/A')
      .join(", ");

    // Get upcoming payment dates for this loan
    const loanUpcomingPayments = upcomingPayments.filter(up => up.loan_id === loan.loan_id);
    const upcomingDates = loanUpcomingPayments
      .map(up => up.due_date ? new Date(up.due_date).toLocaleDateString('en-IN') : 'N/A')
      .join(", ");

    // Combine all payment dates
    const allPaymentDates = [paymentDates, upcomingDates].filter(d => d).join("; ");

    // Add row to worksheet
    worksheet.addRow({
      loan_id: loan.loan_id,
      name: user.full_name || 'N/A',
      loan_type: loan.product_name || 'General Loan',
      loan_amount: principal,
      remaining_amount: remainingAmount,
      status: loanStatus,
      completion_date: completionDate || 'N/A',
      payment_dates: allPaymentDates || 'No payments yet'
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.key !== 'payment_dates') {
      column.width = Math.max(column.width, 15);
    }
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Add summary information at the bottom
  const summaryRow = worksheet.addRow({});
  summaryRow.getCell(1).value = 'SUMMARY';
  summaryRow.font = { bold: true };

  worksheet.addRow({
    loan_id: 'Total Loans',
    name: loans.length.toString(),
    loan_type: 'Total Amount',
    loan_amount: loans.reduce((sum, loan) => sum + parseFloat(loan.approved_amount || loan.loan_amount || 0), 0),
    remaining_amount: loans.reduce((sum, loan) => {
      // Calculate total payable including interest (matching MyLoans calculation)
      const principal = parseFloat(loan.approved_amount || loan.loan_amount || 0);
      const interestRate = parseFloat(loan.interest_rate_apr || 0);
      const months = parseInt(loan.tenure_months || 0);

      let totalPayable = principal;
      if (principal > 0 && interestRate > 0 && months > 0) {
        const r = interestRate / 12 / 100;
        const pow = Math.pow(1 + r, months);
        const emi = Math.round((principal * r * pow) / (pow - 1));
        totalPayable = emi * months;
      }

      // Match MyLoans: remaining = totalPayable - 0 (totalRepaid hardcoded to 0)
      return sum + Math.max(0, totalPayable);
    }, 0),
    payment_dates: `Generated on: ${new Date().toLocaleDateString('en-IN')}`
  });

  // Style summary rows
  const lastRow = worksheet.lastRow;
  lastRow.font = { bold: true };
  lastRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' } // Light blue
  };

  return await workbook.xlsx.writeBuffer();
};

/**
 * Generate comprehensive Excel report with multiple sheets
 * @param {Object} data - Contains user info, loans, payments, and upcoming payments
 * @returns {Buffer} Excel file buffer
 */
export const generateComprehensiveReport = async (data) => {
  const { user, loans, payments, upcomingPayments } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Loan Management System';
  workbook.created = new Date();

  // Sheet 1: Loan Payments Summary
  const paymentsSheet = workbook.addWorksheet("Loan Payments");

  paymentsSheet.columns = [
    { header: "Loan ID", key: "loan_id", width: 20 },
    { header: "Name", key: "name", width: 25 },
    { header: "Loan Type", key: "loan_type", width: 20 },
    { header: "Loan Amount", key: "loan_amount", width: 15 },
    { header: "Loan Amount Remaining", key: "remaining_amount", width: 25 },
    { header: "Status", key: "status", width: 15 },
    { header: "Completion Date", key: "completion_date", width: 18 },
    { header: "Payment Dates", key: "payment_dates", width: 40 },
  ];

  // Style header
  paymentsSheet.getRow(1).font = { bold: true };
  paymentsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  loans.forEach((loan) => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    const totalPaid = loanPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);

    // Calculate EMI and total payable (including interest) like in MyLoans.jsx
    const principal = parseFloat(loan.approved_amount || loan.loan_amount || 0);
    const interestRate = parseFloat(loan.interest_rate_apr || 0);
    const months = parseInt(loan.tenure_months || 0);

    let emi = 0;
    let totalPayable = principal;
    if (principal > 0 && interestRate > 0 && months > 0) {
      const r = interestRate / 12 / 100;
      const pow = Math.pow(1 + r, months);
      emi = Math.round((principal * r * pow) / (pow - 1));
      totalPayable = emi * months;
    }

    // Calculate remaining amount properly
    const remainingAmount = Math.max(0, totalPayable - totalPaid);

    // Determine loan status and completion date
    let loanStatus = 'Active';
    let completionDate = null;

    if (remainingAmount <= 0 && loanPayments.length > 0) {
      loanStatus = 'Completed';

      // Find the completion date (payment that made balance go to zero or below)
      let runningBalance = totalPayable;
      const sortedPayments = [...loanPayments].sort((a, b) =>
        new Date(a.payment_date) - new Date(b.payment_date)
      );

      for (const payment of sortedPayments) {
        const paymentAmount = parseFloat(payment.amount_paid || 0);
        runningBalance -= paymentAmount;
        if (runningBalance <= 0) {
          completionDate = new Date(payment.payment_date).toLocaleDateString('en-IN');
          break;
        }
      }
    } else if (loan.application_status === 'REJECTED') {
      loanStatus = 'Rejected';
    } else if (loan.application_status === 'DRAFT' || loan.application_status === 'SUBMITTED') {
      loanStatus = 'Pending Approval';
    }

    const paymentDates = loanPayments
      .map(p => p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : 'N/A')
      .join(", ");

    const loanUpcomingPayments = upcomingPayments.filter(up => up.loan_id === loan.loan_id);
    const upcomingDates = loanUpcomingPayments
      .map(up => up.due_date ? new Date(up.due_date).toLocaleDateString('en-IN') : 'N/A')
      .join(", ");

    const allPaymentDates = [paymentDates, upcomingDates].filter(d => d).join("; ");

    paymentsSheet.addRow({
      loan_id: loan.loan_id,
      name: user.full_name || 'N/A',
      loan_type: loan.product_name || 'General Loan',
      loan_amount: principal,
      remaining_amount: remainingAmount,
      status: loanStatus,
      completion_date: completionDate || 'N/A',
      payment_dates: allPaymentDates || 'No payments yet'
    });
  });

  // Sheet 2: Detailed Payment History
  const historySheet = workbook.addWorksheet("Payment History");

  historySheet.columns = [
    { header: "Payment ID", key: "payment_id", width: 25 },
    { header: "Loan ID", key: "loan_id", width: 25 },
    { header: "Installment No", key: "installment_no", width: 18 },
    { header: "Scheduled Installment Amount", key: "scheduled_installment_amount", width: 25 },
    { header: "Amount Paid", key: "amount_paid", width: 15 },
    { header: "Principal Paid", key: "principal_paid", width: 15 },
    { header: "Interest Paid", key: "interest_paid", width: 15 },
    { header: "Payment Date", key: "payment_date", width: 18 },
    { header: "Payment Method", key: "payment_method", width: 20 },
    { header: "Transaction Reference", key: "transaction_ref", width: 30 },
  ];

  historySheet.getRow(1).font = { bold: true };
  historySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  payments.forEach((payment) => {
    historySheet.addRow({
      payment_id: payment.payment_id,
      loan_id: payment.loan_id || 'N/A',
      installment_no: payment.installment_no ? `Installment ${payment.installment_no}` : 'N/A',
      scheduled_installment_amount: parseFloat(payment.scheduled_installment_amount || 0),
      amount_paid: parseFloat(payment.amount_paid || 0),
      principal_paid: parseFloat(payment.allocated_principal || 0),
      interest_paid: parseFloat(payment.allocated_interest || 0),
      payment_date: payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN') : 'N/A',
      payment_method: payment.payment_method || 'N/A',
      transaction_ref: payment.transaction_reference || 'N/A'
    });
  });

  // Add borders to all cells in Payment History sheet
  historySheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Sheet 3: Upcoming Payments
  const upcomingSheet = workbook.addWorksheet("Upcoming Payments");

  upcomingSheet.columns = [
    { header: "Loan ID", key: "loan_id", width: 20 },
    { header: "Due Date", key: "due_date", width: 15 },
    { header: "Amount Due", key: "amount_due", width: 15 },
    { header: "Status", key: "status", width: 15 },
  ];

  upcomingSheet.getRow(1).font = { bold: true };
  upcomingSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  upcomingPayments.forEach((upcoming) => {
    upcomingSheet.addRow({
      loan_id: upcoming.loan_id || 'N/A',
      due_date: upcoming.due_date ? new Date(upcoming.due_date).toLocaleDateString('en-IN') : 'N/A',
      amount_due: parseFloat(upcoming.amount || 0),
      status: upcoming.status || 'N/A'
    });
  });

  return await workbook.xlsx.writeBuffer();
};
