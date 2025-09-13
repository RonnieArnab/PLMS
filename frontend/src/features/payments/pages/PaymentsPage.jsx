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

import { Download } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function PaymentsPage() {
  const { user, fetchCustomer } = useAuth();
  const [searchParams] = useSearchParams();
  const loanId = searchParams.get('loan');

  // copy state/logic from original page
  const [dues, setDues] = useState(null);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Fetch complete profile data
        const profileResponse = await fetchCustomer();
        if (profileResponse?.ok) {
          const profile = profileResponse.customer || profileResponse.user;
          setProfileData(profile);
          console.log('Profile data fetched:', profile);
        }

        // Fetch payments data
        const paymentsResponse = loanId ? await PaymentsService.getByLoan(loanId) : await PaymentsService.getByUser(user.id);
        console.log('Payments data:', paymentsResponse);

        if (paymentsResponse && paymentsResponse.data) {
          const payments = paymentsResponse.data;
          setPaymentsHistory(payments);

          // Set up payment dues data
          if (payments.length > 0) {
            const lastPayment = payments[0];
            setDues({
              totalDue: 2500,
              dueDate: "2025-09-15",
              lastPayment: lastPayment,
              upcomingPayments: [
                { id: "pay_20250915", date: "2025-09-15", amount: 2500, status: "due" },
                { id: "pay_20251015", date: "2025-10-15", amount: 2500, status: "upcoming" },
              ],
            });
          } else {
            // Set default dues if no payments found
            setDues({
              totalDue: 2500,
              dueDate: "2025-09-15",
              lastPayment: {
                id: "N/A",
                date: "No payments yet",
                amount: 0,
                method: "N/A",
                ref: "N/A"
              },
              upcomingPayments: [
                { id: "pay_20250915", date: "2025-09-15", amount: 2500, status: "due" },
                { id: "pay_20251015", date: "2025-10-15", amount: 2500, status: "upcoming" },
              ],
            });
          }
        }
      } catch (error) {
        console.error('API Error:', error);
        // Fallback to basic data
        setDues({
          totalDue: 2500,
          dueDate: "2025-09-15",
          lastPayment: {
            id: "N/A",
            date: "No payments yet",
            amount: 0,
            method: "N/A",
            ref: "N/A"
          },
          upcomingPayments: [
            { id: "pay_20250915", date: "2025-09-15", amount: 2500, status: "due" },
            { id: "pay_20251015", date: "2025-10-15", amount: 2500, status: "upcoming" },
          ],
        });
        setPaymentsHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, loanId]);

  const totalPaid = useMemo(
    () => paymentsHistory.reduce((s, p) => s + (p.amount || 0), 0),
    [paymentsHistory]
  );

  // Create download handler that includes user details
  const handleDownloadReceipt = (payment) => {
    // Use complete profile data if available, otherwise fall back to user from auth
    const userProfile = profileData || user;
    downloadReceiptPdf(payment, userProfile);
  };

  const handleCompletePayment = () => setModalOpen(true);
  const handlePaymentSuccess = (payment) => {
    setPaymentsHistory((p) => [payment, ...p]);
    setResult({ ok: true, message: "Payment recorded successfully! 🎉" });
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
                  {loanId ? `Make Payment for Loan ${loanId}` : 'Make a Payment'}
                </h1>
                <Text variant="muted" className="mt-2">
                  Manage your loan payments, download PDF receipts and monthly
                  statements.
                </Text>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search receipts / refs..."
                  className="max-w-sm hidden md:block"
                />
                <Button
                  variant="gradient"
                  size="md"
                  className="gap-2"
                  style={{
                    backgroundImage: "linear-gradient(90deg,#84cc16,#22c55e)",
                    color: "white",
                  }}
                  onClick={() => {
                    /* download logic */
                  }}
                  disabled={loading}>
                  <Download className="w-4 h-4 text-white" /> Download All
                  Statements
                </Button>
              </div>
            </div>
          </Paper>
        </MotionFadeIn>

        <MotionFadeIn>
          <Grid cols={3} className="gap-6">
            <KpiCards loading={loading} dues={dues} totalPaid={totalPaid} />
          </Grid>
        </MotionFadeIn>

        <MotionFadeIn>
          <MainPaymentCard
            loading={loading}
            dues={dues || {}}
            onDownloadLastReceipt={handleDownloadReceipt}
            onPay={handleCompletePayment}
            result={result}
          />
        </MotionFadeIn>

        <MotionFadeIn>
          <UpcomingPayments
            loading={loading}
            upcoming={dues?.upcomingPayments || []}
            onDownload={handleDownloadReceipt}
          />
        </MotionFadeIn>

        <MotionFadeIn>
          <PaymentHistory
            loading={loading}
            history={paymentsHistory}
            onDownload={handleDownloadReceipt}
          />
        </MotionFadeIn>

        <AnimatePresence>
          {modalOpen && (
            <PaymentModal
              open={modalOpen}
              amount={dues?.totalDue || 0}
              onClose={() => setModalOpen(false)}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
