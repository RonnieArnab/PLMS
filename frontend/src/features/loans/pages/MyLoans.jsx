

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {Download, DollarSign, Calendar, CreditCard, FileText } from "lucide-react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Card } from "@components/ui/Card.jsx";
import { Text } from "@components/ui/Text.jsx";
import KPIStat from "@features/loans/components/KPIStat.jsx";
import LoanCard from "@features/loans/components/LoanCard.jsx";
import { toUiLoan, inr } from "@features/loans/utils/myloansUtils";
import { useAuth } from "@context/AuthContext"; // adjust path as needed
import { jsPDF } from "jspdf";


export function MyLoans() {
  const { user } = useAuth(); // ✅ Only call inside a component
  const [loansData, setLoansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`http://localhost:4000/api/loan-applications/user/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLoansData(data.data || []);
        } else {
          setError(data.message || "Failed to fetch loans");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Network error");
        setLoading(false);
      });
  }, [user?.id]);
   

  const { activeLoans, completedLoans } = useMemo(() => {
    const ui = loansData.map(toUiLoan);
    return {
      activeLoans: ui.filter((l) => l.status === "active"),
      completedLoans: ui.filter((l) => l.status === "completed"),
    };
  }, [loansData]);

  const [activeTab, setActiveTab] = useState("active");
  const loans = activeTab === "active" ? activeLoans : completedLoans;

  const tabs = [
    { id: "active", label: "Active Loans", count: activeLoans.length },
    { id: "completed", label: "Completed", count: completedLoans.length },
  ];

  const totalOutstanding = activeLoans.reduce(
    (sum, l) => sum + (l.remainingBalance || 0),
    0
  );
  const totalMonthly = activeLoans.reduce(
    (sum, l) => sum + (l.monthlyPayment || 0),
    0
  );
  const nextDate =
    activeLoans
      .map((l) => (l.nextPaymentDate ? new Date(l.nextPaymentDate) : null))
      .filter(Boolean)
      .sort((a, b) => a - b)[0] || null;

const [selectedLoan, setSelectedLoan] = useState(null);

const handleView = (loan) => {
  console.log("view", loan);
  setSelectedLoan(loan);

};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const handleDownload = (loan) => {
  const doc = new jsPDF();
  const primary = "#00BFA6";
  const textDark = "#0D1B2A";

  // ================== HEADER ==================
  doc.setFillColor(230, 247, 244);
  doc.roundedRect(14, 10, 12, 12, 3, 3, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primary);
  doc.text("$", 18, 18);

  doc.setFontSize(18);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text("ProLoan", 30, 18);

  doc.setFontSize(22);
  doc.setTextColor(textDark);
  doc.setFont("helvetica", "bold");
  doc.text("LOAN DETAILS", 105, 35, { align: "center" });

  // ================== LOAN META ==================
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Loan ID: ${loan.id}`, 130, 15);
  doc.text(`Generated: ${formatDateTime(new Date())}`, 130, 22);

  // ================== LOAN INFORMATION ==================
  const labels = [
    "Loan Account:",
    "Product Name:",
    "Loan Amount:",
    "Approved Amount:",
    "Approved Date:",
    "Disbursement Date:",
    "Tenure (months):",
    "Interest Rate:",
    "Monthly Payment:",
    "Remaining Balance:",
    "Status:",
    "Next Payment Date:"
  ];

  const values = [
    loan.id || "N/A",
    loan.productName || "N/A",
    `₹${loan.amount || "0.00"}`,
    loan.approvedAmount ? `₹${loan.approvedAmount}` : "N/A",
    loan.approvedDate ? formatDateTime(loan.approvedDate) : "N/A",
    loan.appliedDate ? formatDateTime(loan.appliedDate) : "N/A",
    loan.tenureMonths ? `${loan.tenureMonths} months` : "N/A",
    loan.interestRate ? `${loan.interestRate}%` : "N/A",
    loan.monthlyPayment ? `₹${loan.monthlyPayment}` : "N/A",
    loan.remainingBalance ? `₹${loan.remainingBalance}` : "N/A",
    loan.status || "N/A",
    loan.nextPaymentDate ? formatDateTime(loan.nextPaymentDate) : "N/A"
  ];

  const startY = 75; // starting y position for fields
  const lineHeight = 10; // space between fields
  const rectHeight = labels.length * lineHeight + 10; // brown rectangle height (+padding)

  // Brown rectangle covering all fields
  doc.setLineWidth(2);
  doc.setDrawColor(200); // brown
  doc.rect(15, startY - 5, 180, rectHeight); // startY-5 for top padding

  // Section title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textDark);
  doc.text("LOAN INFORMATION", 20, startY - 10);

  // Draw field labels and values
  let y = startY;
  labels.forEach((label, i) => {
    doc.setFont("courier", "bold");
    doc.setTextColor(50);
    doc.text(label, 20, y);

    doc.setFont("courier", "normal");
    doc.text(values[i], 80, y);
    y += lineHeight;
  });

  // ================== FOOTER ==================
  const footerY = startY - 5 + rectHeight + 10; // 10px gap after brown rectangle
  doc.setDrawColor(primary);
  doc.setLineWidth(1.5);
  doc.line(20, footerY, 190, footerY);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("This is a system-generated loan detail report.", 105, footerY + 8, { align: "center" });
  doc.text("For assistance, contact support@proloan.com", 105, footerY + 15, { align: "center" });

  // Save the PDF
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '');
  doc.save(`Loan_Details_${loan.productName}.pdf`);
};


 const convertToCSV = (loansData) => {
    if (!loansData || loansData.length === 0) return '';

    // Define CSV headers based on loan application data structure
    const headers = [
      'Loan ID',
      'Product Name',
      'Target Profession',
      'Loan Amount',
      'Tenure (Months)',
      'Application Status',
      'Approved Amount',
      'Interest Rate (%)',
      'Processing Fee',
      'Risk Grade',
      'Applied Date',
      'Approved Date',
      'Disbursement Date',
      'Full Name',
      'Email',
      'Profession',
      'Purpose'
    ];

    // Convert data to CSV rows
    const rows = loansData.map(loan => [
      loan.loan_id || '',
      loan.product_name || '',
      loan.target_profession || '',
      loan.loan_amount || '',
      loan.tenure_months || '',
      loan.application_status || '',
      loan.loan_amount || '',
      loan.interest_rate_apr || '',
      loan.processing_fee || '',
      loan.risk_grade || '',
      loan.applied_date ? new Date(loan.applied_date).toLocaleDateString() : '',
      loan.applied_date ? new Date(loan.applied_date).toLocaleDateString() : '',
      loan.disbursement_date ? new Date(loan.disbursement_date).toLocaleDateString() : '',
      loan.full_name || '',
      loan.email || '',
      loan.profession || '',
      loan.purpose || ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  // Export loans to CSV
  const exportToCSV = () => {
    if (!loansData || loansData.length === 0) {
      alert('No loan data available to export');
      return;
    }

    setExporting(true);

    try {
      const csvContent = convertToCSV(loansData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `my_loans_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV file');
    } finally {
      setExporting(false);
    }
  };


  const handlePay = (loan) => console.log("pay", loan.id);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        <MotionFadeIn>
          <Paper
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(90deg, rgba(132,204,22,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(34,197,94,0.02) 100%)",
            }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  My Loans
                </h1>
                <Text variant="muted" className="mt-2">
                  Manage your active and completed loans
                </Text>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                
                <Button
                onClick={exportToCSV}
                disabled={exporting || loans.length === 0}
                className="flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
              </div>
            </div>
          </Paper>
        </MotionFadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPIStat
            icon={DollarSign}
            label="Total Outstanding"
            value={`₹${inr(totalOutstanding)}`}
            loading={loading}
          />
          <KPIStat
            icon={CreditCard}
            label="Monthly Payment"
            value={`₹${inr(totalMonthly)}`}
            loading={loading}
          />
          <KPIStat
            icon={Calendar}
            label="Next Payment"
            value={
              nextDate
                ? nextDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "2-digit",
                  })
                : "-"
            }
            loading={loading}
          />
        </div>

        <MotionFadeIn>
          <div className="tabs tabs-boxed bg-base-200 p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab tab-lg gap-2 ${
                  activeTab === tab.id ? "tab-active" : ""
                }`}
                disabled={loading}>
                {tab.label}
                <div className="badge badge-sm">{tab.count}</div>
              </button>
            ))}
          </div>
        </MotionFadeIn>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (loading ? "-loading" : "")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28 }}
            className="space-y-6">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <LoanCard key={`skeleton-${i}`} loading index={i} />
              ))
            ) : loans.length ? (
              loans.map((loan, idx) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  index={idx}
                  onView={handleView}
                  onDownload={handleDownload}
                  onPay={handlePay}
                />
              ))
            ) : (
              <MotionFadeIn>
                <Card className="p-8 text-center rounded-lg shadow-sm">
                  <div className="py-8">
                    <DollarSign className="w-14 h-14 text-base-content/30 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-2">
                      No {activeTab} loans found
                    </h3>
                    <Text variant="muted">
                      {activeTab === "active"
                        ? "You don't have any active loans at the moment."
                        : "You haven't completed any loans yet."}
                    </Text>
                  </div>
                </Card>
              </MotionFadeIn>
            )}
          </motion.div>
        </AnimatePresence>
       {selectedLoan && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Loan Details</h2>
      <table className="table-auto w-full text-sm text-left border-collapse border border-gray-300">
        <tbody>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Loan ID</th>
            <td className="border border-gray-300 px-4 py-2">{selectedLoan.id}</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Product Name</th>
            <td className="border border-gray-300 px-4 py-2">{selectedLoan.productName}</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Amount</th>
            <td className="border border-gray-300 px-4 py-2">₹{inr(selectedLoan.amount)}</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Approved Amount</th>
            <td className="border border-gray-300 px-4 py-2">
              {selectedLoan.approvedAmount != null ? `₹${inr(selectedLoan.approvedAmount)}` : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Approved Date</th>
            <td className="border border-gray-300 px-4 py-2">
              {selectedLoan.approvedDate ? new Date(selectedLoan.approvedDate).toLocaleDateString() : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Disbursement Date</th>
            <td className="border border-gray-300 px-4 py-2">
              {selectedLoan.disbursementDate ? new Date(selectedLoan.disbursementDate).toLocaleDateString() : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Closed Date</th>
            <td className="border border-gray-300 px-4 py-2">
              {selectedLoan.closedDate ? new Date(selectedLoan.closedDate).toLocaleDateString() : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Interest Rate</th>
            <td className="border border-gray-300 px-4 py-2">{selectedLoan.interestRate}%</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Monthly Payment</th>
            <td className="border border-gray-300 px-4 py-2">₹{inr(selectedLoan.monthlyPayment)}</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Remaining Balance</th>
            <td className="border border-gray-300 px-4 py-2">₹{inr(selectedLoan.remainingBalance)}</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Next Payment Date</th>
            <td className="border border-gray-300 px-4 py-2">
              {selectedLoan.nextPaymentDate
                ? new Date(selectedLoan.nextPaymentDate).toLocaleDateString()
                : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Tenure</th>
            <td className="border border-gray-300 px-4 py-2">{selectedLoan.tenureMonths} months</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Status</th>
            <td className="border border-gray-300 px-4 py-2">{selectedLoan.status}</td>
          </tr>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Total Repaid</th>
            <td className="border border-gray-300 px-4 py-2">₹{inr(selectedLoan.totalRepaid)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={() => setSelectedLoan(null)}>
          Close
        </Button>
      </div>
    </div>
  </div>
)}

      </div>
    </DashboardLayout>
  );
}
