import jsPDF from "jspdf";

// Utility to format date with time
const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Generate comprehensive payment receipt PDF
export const downloadReceiptPdf = (payment, userDetails = null, loanDetails = null) => {
  const doc = new jsPDF();
  const primary = "#00BFA6";
  const textDark = "#0D1B2A";

  // ================== HEADER ==================
  doc.setFillColor(230, 247, 244); // bg-[#E6F7F4]
  doc.roundedRect(14, 10, 12, 12, 3, 3, "F"); // company logo circle
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primary);
  doc.text("$", 18, 18); // ProLoan logo

  doc.setFontSize(18);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text("ProLoan", 30, 18);

  // Check if this is a final payment that completed the loan
  const isFinalPayment = loanDetails && loanDetails.isCompleted && loanDetails.remainingBalance <= 0;

  doc.setFontSize(22);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text(isFinalPayment ? "FINAL PAYMENT RECEIPT" : "PAYMENT RECEIPT", 105, 35, { align: "center" });

  // ================== RECEIPT META ==================
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${payment.id}`, 130, 15);
  doc.text(`Generated: ${formatDateTime(new Date())}`, 130, 22);

  // ================== PERSONAL INFORMATION BOX ==================
  doc.setLineWidth(2);
  doc.setDrawColor(200);
  doc.rect(15, 45, 180, 55); // Personal information box

  doc.setFontSize(14);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONAL INFORMATION", 20, 55);

  // Left column - Personal Info
  doc.setFontSize(11);
  doc.setFont("courier", "bold");
  doc.setTextColor(50);
  doc.text(`Full Name:`, 20, 68);
  doc.text(`Email:`, 20, 76);
  doc.text(`Phone:`, 20, 84);
  doc.text(`Address:`, 20, 92);

  // Right column - Financial Info
  doc.text(`Date of Birth:`, 110, 68);
  doc.text(`Bank:`, 110, 76);
  doc.text(`Account:`, 110, 84);

  // Fill in customer data - prioritizing from payment.profile or userDetails or payment.payer
  const profile = payment.profile || userDetails || {};
  const customerName = profile?.full_name || profile?.name || payment.payer?.name || "N/A";
  const customerMobile = profile?.phone || profile?.mobile || userDetails?.phone_number || "N/A";
  const customerEmail = profile?.email || payment.payer?.email || "N/A";
  const customerAddress = profile?.address || "N/A";
  const dateOfBirth = profile?.date_of_birth || "N/A";
  const bankName = profile?.bank_name || "N/A";
  const bankAccount = profile?.account_number ?
    `XXXX-XXXX-${profile.account_number.slice(-4)}` :
    `XXXX-XXXX-XXXX`;

  doc.setFont("courier", "normal");
  doc.text(customerName, 50, 68);
  doc.text(customerEmail, 50, 76);
  doc.text(customerMobile, 50, 84);
  doc.text(customerAddress, 50, 92);

  doc.text(dateOfBirth, 140, 68);
  doc.text(bankName, 140, 76);
  doc.text(bankAccount, 140, 84);

  // ================== LOAN INFORMATION BOX ==================
  doc.setLineWidth(2);
  doc.setDrawColor(200);
  doc.rect(15, 105, 180, 25); // Loan information box

  doc.setFontSize(14);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text("LOAN INFORMATION", 20, 115);

  // Loan Account
  doc.setFontSize(11);
  doc.setFont("courier", "bold");
  doc.setTextColor(50);
  doc.text(`Loan Account:`, 20, 125);

  const loanAccount = payment.loan_id || profile?.loan_account || payment.id || "N/A";
  doc.setFont("courier", "normal");
  doc.text(loanAccount, 55, 125);

  // ================== PAYMENT DETAILS BOX ==================
  doc.setLineWidth(2);
  doc.setDrawColor(200);
  doc.rect(15, 135, 180, 60); // Payment details box

  doc.setFontSize(14);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", 20, 145);

  // Left column
  doc.setFontSize(11);
  doc.setFont("courier", "bold");
  doc.setTextColor(50);
  doc.text(`Installment No:`, 20, 160);
  doc.text(`Amount Paid:`, 20, 170);
  doc.text(`Payment Date:`, 20, 180);

  // Right column
  doc.text(`Transaction ID:`, 110, 160);
  doc.text(`Status:`, 110, 170);

  // Fill in payment data
  const installment = payment.installment || payment.installment_number || "1";
  const amount = `₹${payment.amount || payment.amount_paid}`;
  const paymentDate = formatDateTime(payment.date || payment.payment_date);
  const paymentMode = payment.method || payment.payment_method || "UPI";
  const transactionId = payment.transaction_reference || payment.reference || "N/A";
  doc.setFont("courier", "normal");
  doc.text(installment.toString(), 60, 160);
  doc.text(amount, 60, 170);
  doc.text(paymentDate, 60, 180);

  doc.text(transactionId, 140, 160);
  doc.setTextColor(primary);
  doc.setFont("helvetica", "normal");
  doc.text("Successful ✅", 140, 170);

  // ================== LOAN COMPLETION STATUS (if applicable) ==================
  let nextY = 195;
  if (isFinalPayment && loanDetails) {
    doc.setLineWidth(2);
    doc.setDrawColor(200);
    doc.rect(15, nextY, 180, 25); // Loan completion box

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primary);
    doc.text("🎉 LOAN COMPLETED!", 20, nextY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Total Amount Paid: ₹${loanDetails.totalRepaid || "0.00"}`, 20, nextY + 18);
    doc.text(`Completion Date: ${formatDateTime(payment.date || payment.payment_date)}`, 110, nextY + 18);

    nextY += 30;
  }

  // ================== AMOUNT BREAKDOWN ==================
  doc.setLineWidth(2);
  doc.setDrawColor(200);
  doc.rect(15, nextY, 180, 35); // Amount breakdown box

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(textDark);
  doc.text("Amount Breakdown", 20, nextY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(50);

  // Calculate principal and interest if not provided
  const totalAmount = parseFloat(payment.amount || payment.amount_paid || 0);
  const principalAmount = parseFloat(payment.principal || 0);
  const interestAmount = parseFloat(payment.interest || 0);

  // If principal and interest are not set, use simple allocation (80% principal, 20% interest)
  const calculatedPrincipal = principalAmount > 0 ? principalAmount : (totalAmount * 0.8);
  const calculatedInterest = interestAmount > 0 ? interestAmount : (totalAmount * 0.2);

  // Left column
  doc.text(`Payment Mode: ${paymentMode || "N/A"}`, 20, nextY + 20);
  doc.text(`Principal Amount: ₹${calculatedPrincipal.toFixed(2)}`, 20, nextY + 30);

  // Right column
  doc.text(`Interest Amount: ₹${calculatedInterest.toFixed(2)}`, 120, nextY + 20);
  doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 120, nextY + 30);

  // add horizontal lines to make table
  doc.setLineWidth(0.5);
  doc.line(15, nextY + 25, 195, nextY + 25);

  doc.setLineWidth(1);
  doc.line(100, nextY, 100, nextY + 35); // vertical middle

  nextY += 40;

  // ================== FOOTER ==================
  doc.setDrawColor(primary);
  doc.line(20, 275, 190, 275);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("This is a system-generated receipt. No signature required.", 105, 283, { align: "center" });
  doc.text("For any queries, contact customer support at support@proloan.com", 105, 290, { align: "center" });

  // Add page number
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Page 1 of 1", 95, 295);

  // Save the PDF with timestamp
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '');
  doc.save(`Payment_Receipt_${payment.id}_${timestamp}.pdf`);
};
