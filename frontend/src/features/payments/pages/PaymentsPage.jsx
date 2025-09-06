import React, { useEffect, useMemo, useRef, useState } from "react";
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

import { Download } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const mockDues =
  "/* keep your mock data in the app or import from a shared mock file */";

export default function PaymentsPage() {
  // copy state/logic from original page
  const [dues, setDues] = useState(null);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      // replace with real fetch
      setDues(
        window.__MOCK_DUES__ || {
          totalDue: 2500,
          dueDate: "2025-09-15",
          lastPayment: {
            id: "pay_20250815",
            date: "2025-08-15",
            amount: 2500,
            method: "UPI",
            ref: "TRX12345",
            payer: { name: "Arnab Ghosh", email: "arnab@example.com" },
          },
          upcomingPayments: [
            {
              id: "pay_20250915",
              date: "2025-09-15",
              amount: 2500,
              status: "due",
            },
            {
              id: "pay_20251015",
              date: "2025-10-15",
              amount: 2500,
              status: "upcoming",
            },
          ],
        }
      );
      setPaymentsHistory(window.__MOCK_HISTORY__ || []);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  const totalPaid = useMemo(
    () => paymentsHistory.reduce((s, p) => s + (p.amount || 0), 0),
    [paymentsHistory]
  );

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
                  Make a Payment
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
            onDownloadLastReceipt={(p) => downloadReceiptPdf(p)}
            onPay={handleCompletePayment}
            result={result}
          />
        </MotionFadeIn>

        <MotionFadeIn>
          <UpcomingPayments
            loading={loading}
            upcoming={dues?.upcomingPayments || []}
            onDownload={(p) => downloadReceiptPdf(p)}
          />
        </MotionFadeIn>

        <MotionFadeIn>
          <PaymentHistory
            loading={loading}
            history={paymentsHistory}
            onDownload={(p) => downloadReceiptPdf(p)}
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
