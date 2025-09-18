import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
import { Paper } from "@components/ui/Paper.jsx";
import { Grid } from "@components/ui/Grid.jsx";
import { Input } from "@components/ui/Input.jsx";
import { Button } from "@components/ui/Button.jsx";
import { Text } from "@components/ui/Text.jsx";

import KpiCards from "@features/payments/components/KpiCards.jsx";
import MainPaymentCard from "@features/payments/components/MainPaymentCard.jsx";
import UpcomingPayments from "@features/payments/components/UpcomingPayments.jsx";
import PaymentHistory from "@features/payments/components/PaymentHistory.jsx";
import PaymentModal from "@features/payments/components/PaymentModal.jsx";
import { downloadReceiptPdf } from "@features/payments/utils/receiptUtils";
import { useAuth } from "@context/AuthContext";
import { PaymentsService } from "@services/paymentService";
import { RepaymentService } from "@services/repaymentService";
import { calcEmi } from "@features/loans/utils/myloansUtils";
import api from "@api/api";

import { Download } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function PaymentsPage() {
  const { user, fetchCustomer } = useAuth();
  const [searchParams] = useSearchParams();
  const loanId = searchParams.get("loan");
  const urlAmount = searchParams.get("amount");
  const urlDueDate = searchParams.get("dueDate");
  const urlProduct = searchParams.get("product");

  // copy state/logic from original page
  const [allLoansData, setAllLoansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [result, setResult] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      console.log("PaymentsPage useEffect triggered for user:", user.id);

      setLoading(true);
      try {
        // Fetch complete profile data
        const profileResponse = await fetchCustomer();
        if (profileResponse?.ok) {
          const profile = profileResponse.customer || profileResponse.user;
          setProfileData(profile);
          console.log("Profile data fetched:", profile);
        }

        // Fetch all user's loans with product information
        console.log("Fetching all user loans for user:", user.id);
        const userLoansResponse = await fetch(
          `http://localhost:4000/api/loan-applications/user/${user.id}`
        );
        if (userLoansResponse.ok) {
          const userLoansResult = await userLoansResponse.json();
          console.log("User loans response:", userLoansResult);

          if (
            userLoansResult.success &&
            userLoansResult.data &&
            userLoansResult.data.length > 0
          ) {
            console.log("Found loans:", userLoansResult.data.length);

            // Process each loan to get payment data and product info
            const loansWithPayments = await Promise.all(
              userLoansResult.data.map(async (loan) => {
                // Fetch product information for this loan
                let productName = "General Loan";
                try {
                  const productResponse = await fetch(
                    `http://localhost:4000/api/loan-products/${loan.product_id}`
                  );
                  if (productResponse.ok) {
                    const productResult = await productResponse.json();
                    if (productResult.success && productResult.data) {
                      productName = productResult.data.name;
                    }
                  }
                } catch (error) {
                  console.log(
                    "Could not fetch product info for loan:",
                    loan.loan_id,
                    error
                  );
                }
                try {
                  // Fetch payments for this loan
                  const paymentsResponse = await PaymentsService.getByLoan(
                    loan.loan_id
                  );
                  const payments = paymentsResponse?.data || [];

                  // Calculate payment amount and due date
                  let paymentAmount = 0;
                  let dueDate = null;

                  // Calculate monthly payment using EMI formula
                  const principal =
                    loan.approved_amount || loan.loan_amount || 0;
                  const tenure = loan.tenure_months || 1;
                  const interestRate = loan.interest_rate_apr || 0;

                  if (principal > 0 && tenure > 0 && interestRate > 0) {
                    paymentAmount = calcEmi(principal, interestRate, tenure);
                  }

                  // Try to get next payment from repayment schedule
                  try {
                    const repaymentResponse = await RepaymentService.getNext(
                      loan.loan_id
                    );
                    if (
                      repaymentResponse.status === "success" &&
                      repaymentResponse.data
                    ) {
                      paymentAmount =
                        repaymentResponse.data.total_due || paymentAmount;
                      dueDate = repaymentResponse.data.due_date || dueDate;
                    }
                  } catch (error) {
                    console.log(
                      "No repayment schedule found for loan:",
                      loan.loan_id,
                      error.message
                    );
                    // Use default due date if no repayment schedule
                    if (!dueDate) {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      dueDate = nextMonth.toISOString().split("T")[0];
                    }
                  }

                  // Calculate penalty if overdue
                  const currentDate = new Date();
                  const paymentDueDate = dueDate ? new Date(dueDate) : null;
                  const isOverdue =
                    paymentDueDate && currentDate > paymentDueDate;
                  const penaltyAmount = isOverdue
                    ? Math.round(paymentAmount * 0.02)
                    : 0;
                  const totalAmountWithPenalty = paymentAmount + penaltyAmount;

                  // For completed loans, set amount due to 0
                  // Allow for small rounding differences (less than 1 rupee)
                  const isCompleted =
                    loan.isCompleted ||
                    (loan.remainingBalance !== undefined &&
                      loan.remainingBalance <= 1);
                  const finalTotalDue = isCompleted
                    ? 0
                    : totalAmountWithPenalty;

                  return {
                    ...loan,
                    productName,
                    payments,
                    dues: {
                      totalDue: finalTotalDue,
                      originalAmount: paymentAmount,
                      penaltyAmount: penaltyAmount,
                      isOverdue: isOverdue,
                      dueDate: dueDate,
                      lastPayment:
                        payments.length > 0
                          ? payments[0]
                          : {
                              id: "N/A",
                              date: "No payments yet",
                              amount: 0,
                              method: "N/A",
                              transaction_ref: "N/A",
                            },
                      upcomingPayments:
                        dueDate && paymentAmount > 0 && !isCompleted
                          ? [
                              {
                                id: `pay_${loan.loan_id}_${Date.now()}`,
                                date: dueDate,
                                amount: paymentAmount,
                                status: isOverdue ? "due" : "upcoming",
                              },
                            ]
                          : [],
                    },
                  };
                } catch (error) {
                  console.error("Error processing loan:", loan.loan_id, error);
                  return {
                    ...loan,
                    payments: [],
                    dues: {
                      totalDue: 0,
                      originalAmount: 0,
                      penaltyAmount: 0,
                      isOverdue: false,
                      dueDate: null,
                      lastPayment: {
                        id: "N/A",
                        date: "No payments yet",
                        amount: 0,
                        method: "N/A",
                        transaction_ref: "N/A",
                      },
                      upcomingPayments: [],
                    },
                  };
                }
              })
            );

            setAllLoansData(loansWithPayments);
            console.log("All loans with payments data:", loansWithPayments);
          } else {
            console.log("No loans found for user");
            setAllLoansData([]);
          }
        } else {
          console.log("Failed to fetch user loans:", userLoansResponse.status);
          setAllLoansData([]);
        }
      } catch (error) {
        console.error("API Error:", error);
        setAllLoansData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]); // Only depend on user.id

  // Calculate total paid per loan and find completion date
  const getLoanTotalPaid = (payments, totalPayable) => {
    let totalPaid = 0;
    let completionDate = null;

    // Sort payments by date (most recent first)
    const sortedPayments = [...(payments || [])].sort(
      (a, b) =>
        new Date(b.payment_date || b.date) - new Date(a.payment_date || a.date)
    );

    for (const payment of sortedPayments) {
      const amount = payment.amount || payment.amount_paid || 0;
      const paymentAmount =
        typeof amount === "string" ? parseFloat(amount) || 0 : amount;
      totalPaid += paymentAmount;
    }

    // For completed loans, use the most recent payment date as completion date
    if (sortedPayments.length > 0) {
      completionDate = sortedPayments[0].payment_date || sortedPayments[0].date;
    }

    return { totalPaid, completionDate };
  };

  // Create download handler that includes user details and loan details
  const handleDownloadReceipt = (payment) => {
    // Use complete profile data if available, otherwise fall back to user from auth
    const userProfile = profileData || user;

    // Find the loan details for this payment
    const loanDetails = allLoansData.find(
      (loan) => loan.loan_id === payment.loan_id
    );

    downloadReceiptPdf(payment, userProfile, loanDetails);
  };

  // Handle Excel export download
  const handleDownloadAllStatements = async () => {
    try {
      console.log("Downloading Excel statements for user:", user?.id);

      const response = await PaymentsService.exportStatements(user?.id);

      // Get filename from response headers
      const contentDisposition = response.headers?.get("Content-Disposition");
      let filename = "Payment_Statement.xlsx";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log("Excel file downloaded successfully:", filename);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      alert("Failed to download Excel file. Please try again.");
    }
  };

  const handleCompletePayment = () => {
    // Only open modal if we have loan data and dues
    if (!loading && dues && (loanId || loanData)) {
      setModalOpen(true);
    } else {
      console.log("Cannot open payment modal: data not ready", {
        loading,
        dues,
        loanId,
        loanData,
      });
    }
  };
  const handlePaymentSuccess = async (payment, loanData) => {
    console.log("Payment success:", payment, "for loan:", loanData.loan_id);

    // Show success message
    setResult({ ok: true, message: "Payment recorded successfully! 🎉" });

    // Refresh data for the specific loan
    try {
      const paymentsResponse = await PaymentsService.getByLoan(
        loanData.loan_id
      );
      console.log(
        "Refreshed payments data for loan:",
        loanData.loan_id,
        paymentsResponse
      );

      if (
        paymentsResponse &&
        paymentsResponse.success &&
        paymentsResponse.data
      ) {
        const updatedPayments = paymentsResponse.data;

        // Update the specific loan in allLoansData
        setAllLoansData((prevLoans) =>
          prevLoans.map((loan) =>
            loan.loan_id === loanData.loan_id
              ? {
                  ...loan,
                  payments: updatedPayments,
                  dues: {
                    ...loan.dues,
                    lastPayment:
                      updatedPayments.length > 0
                        ? updatedPayments[0]
                        : loan.dues.lastPayment,
                  },
                }
              : loan
          )
        );

        console.log("Updated loan data after payment:", loanData.loan_id);
      }
    } catch (error) {
      console.error("Error refreshing payments after success:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <MotionFadeIn>
          <Paper
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(90deg, rgba(132,204,22,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(34,197,94,0.02) 100%)",
            }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Make a Payment
                </h1>
                <Text variant="muted" className="mt-2">
                  Manage your loan payments, download PDF receipts and monthly
                  statements.
                </Text>
              </div>

              <div className="flex items-center gap-3">
                {/* <Input
                  placeholder="Search receipts / refs..."
                  className="max-w-sm hidden md:block"
                /> */}
                <Button
                  variant="gradient"
                  size="md"
                  className="gap-2"
                  style={{
                    backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                    color: "white",
                  }}
                  onClick={handleDownloadAllStatements}
                  disabled={loading}>
                  <Download className="w-4 h-4 text-white" /> Download All
                  Statements
                </Button>
              </div>
            </div>
          </Paper>
        </MotionFadeIn>

        {/* Render payment cards for each loan */}
        {allLoansData.map((loanData, index) => {
          const totalPayable = loanData.totalPayable || 0;
          const { totalPaid: loanTotalPaid, completionDate } = getLoanTotalPaid(
            loanData.payments,
            totalPayable
          );

          return (
            <MotionFadeIn key={loanData.loan_id}>
              <div className="space-y-6">
                {/* Loan type header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {loanData.productName ||
                      loanData.name ||
                      `Loan ${index + 1}`}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Amount: ₹
                    {loanData.approved_amount?.toLocaleString("en-IN") ||
                      loanData.loan_amount?.toLocaleString("en-IN") ||
                      "N/A"}{" "}
                    • Tenure: {loanData.tenure_months} months • Rate:{" "}
                    {loanData.interest_rate_apr}%
                  </p>
                  {/* Show completion status */}
                  {loanData.isCompleted && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Loan Completed - All Installments Paid
                    </div>
                  )}
                  {/* Show payment progress */}
                  <p className="text-xs text-gray-500 mt-1">
                    Payments Made: {loanData.paymentCount || 0} /{" "}
                    {loanData.totalInstallments || loanData.tenure_months}{" "}
                    installments
                  </p>
                </div>

                {/* Loan-specific KPI cards */}
                <Grid cols={3} className="gap-6">
                  <KpiCards
                    loading={loading}
                    dues={loanData.dues || {}}
                    totalPaid={loanTotalPaid}
                  />
                </Grid>

                {/* Payment card for this loan */}
                <MainPaymentCard
                  loading={loading}
                  dues={loanData.dues || {}}
                  onDownloadLastReceipt={handleDownloadReceipt}
                  onPay={() => {
                    setSelectedLoanForPayment(loanData);
                    setModalOpen(true);
                  }}
                  result={result}
                  canPay={
                    !loading &&
                    loanData.dues &&
                    loanData.dues.totalDue > 0 &&
                    !loanData.isCompleted
                  }
                  isCompleted={loanData.isCompleted}
                  totalPaid={loanTotalPaid}
                  completionDate={completionDate}
                />

                {/* Payment history for this loan */}
                <PaymentHistory
                  loading={loading}
                  history={loanData.payments || []}
                  onDownload={handleDownloadReceipt}
                />
              </div>
            </MotionFadeIn>
          );
        })}

        {/* Show message if no loans */}
        {allLoansData.length === 0 && !loading && (
          <MotionFadeIn>
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No loans found. Apply for a loan to start making payments.
              </p>
            </div>
          </MotionFadeIn>
        )}

        <AnimatePresence>
          {modalOpen && selectedLoanForPayment && (
            <PaymentModal
              open={modalOpen}
              amount={selectedLoanForPayment.dues?.totalDue || 0}
              userId={user?.id || user?.user_id}
              loanId={selectedLoanForPayment.loan_id}
              onClose={() => {
                setModalOpen(false);
                setSelectedLoanForPayment(null);
              }}
              onSuccess={(payment) => {
                handlePaymentSuccess(payment, selectedLoanForPayment);
                setSelectedLoanForPayment(null);
              }}
              onDownload={handleDownloadReceipt}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
