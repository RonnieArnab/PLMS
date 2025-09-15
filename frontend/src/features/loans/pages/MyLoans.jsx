// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { AnimatePresence } from "framer-motion";
// import { DollarSign, Calendar, CreditCard, FileText } from "lucide-react";
// import { DashboardLayout } from "@components/layout/DashboardLayout";
// import MotionFadeIn from "@components/ui/MotionFadeIn.jsx";
// import { Paper } from "@components/ui/Paper.jsx";
// import { Button } from "@components/ui/Button.jsx";
// import { Card } from "@components/ui/Card.jsx";
// import { Text } from "@components/ui/Text.jsx";
// import KPIStat from "@features/loans/components/KPIStat.jsx";
// import LoanCard from "@features/loans/components/LoanCard.jsx";
// import { toUiLoan, inr } from "@features/loans/utils/myloansUtils";

// const schemaLoans = [
//   {
//     loan_id: 1,
//     product_id: 101,
//     product_name: "Pro Equipment (Doctor)",
//     loan_amount: 250000,
//     tenure_months: 36,
//     interest_rate_apr: 12.5,
//     application_status: "approved",
//     approved_amount: 240000,
//     approved_date: "2025-08-01",
//     disbursement_date: "2025-08-05",
//     total_repaid: 18060,
//     remaining_balance: 221940,
//     next_due_date: "2025-09-15",
//   },
//   {
//     loan_id: 2,
//     product_id: 102,
//     product_name: "Office Setup (Lawyer)",
//     loan_amount: 75000,
//     tenure_months: 24,
//     interest_rate_apr: 13.0,
//     application_status: "under_review",
//     approved_amount: null,
//     approved_date: null,
//     disbursement_date: null,
//     total_repaid: 0,
//     remaining_balance: 0,
//     next_due_date: null,
//   },
//   {
//     loan_id: 3,
//     product_id: 103,
//     product_name: "Working Capital (Engineer)",
//     loan_amount: 30000,
//     tenure_months: 36,
//     interest_rate_apr: 11.0,
//     application_status: "disbursed",
//     approved_amount: 30000,
//     approved_date: "2022-11-25",
//     disbursement_date: "2022-12-01",
//     total_repaid: 33336,
//     remaining_balance: 0,
//     next_due_date: null,
//     closed_date: "2023-11-30",
//   },
// ];

// export function MyLoans() {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const t = setTimeout(() => setLoading(false), 700);
//     return () => clearTimeout(t);
//   }, []);

//   const { activeLoans, completedLoans } = useMemo(() => {
//     const ui = schemaLoans.map(toUiLoan);
//     return {
//       activeLoans: ui.filter((l) => l.status === "active"),
//       completedLoans: ui.filter((l) => l.status === "completed"),
//     };
//   }, []);

//   const [activeTab, setActiveTab] = useState("active");
//   const loans = activeTab === "active" ? activeLoans : completedLoans;

//   const tabs = [
//     { id: "active", label: "Active Loans", count: activeLoans.length },
//     { id: "completed", label: "Completed", count: completedLoans.length },
//   ];

//   const totalOutstanding = activeLoans.reduce(
//     (sum, l) => sum + (l.remainingBalance || 0),
//     0
//   );
//   const totalMonthly = activeLoans.reduce(
//     (sum, l) => sum + (l.monthlyPayment || 0),
//     0
//   );
//   const nextDate =
//     activeLoans
//       .map((l) => (l.nextPaymentDate ? new Date(l.nextPaymentDate) : null))
//       .filter(Boolean)
//       .sort((a, b) => a - b)[0] || null;

//   const handleView = (loan) => console.log("view", loan.id);
//   const handleDownload = (loan) => console.log("download", loan.id);
//   const handlePay = (loan) => navigate(`/payments?loan=${loan.id}`);

//   return (
//     <DashboardLayout>
//       <div className="space-y-8 p-6">
//         <MotionFadeIn>
//           <Paper
//             className="rounded-2xl p-6"
//             style={{
//               background:
//                 "linear-gradient(90deg, rgba(132,204,22,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(34,197,94,0.02) 100%)",
//             }}>
//             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
//               <div>
//                 <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
//                   My Loans
//                 </h1>
//                 <Text variant="muted" className="mt-2">
//                   Manage your active and completed loans
//                 </Text>
//               </div>

//               <div className="flex items-center gap-3 w-full md:w-auto">
//                 <div className="hidden md:block">
//                   <input
//                     className="input input-sm input-bordered max-w-xs"
//                     placeholder="Search loans..."
//                   />
//                 </div>
//                 <Button
//                   variant="gradient"
//                   size="md"
//                   style={{
//                     backgroundImage: "linear-gradient(90deg, #84cc16, #22c55e)",
//                     color: "white",
//                   }}
//                   disabled={loading}>
//                   <FileText className="w-4 h-4" /> Export
//                 </Button>
//               </div>
//             </div>
//           </Paper>
//         </MotionFadeIn>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <KPIStat
//             icon={DollarSign}
//             label="Total Outstanding"
//             value={`₹${inr(totalOutstanding)}`}
//             loading={loading}
//           />
//           <KPIStat
//             icon={CreditCard}
//             label="Monthly Payment"
//             value={`₹${inr(totalMonthly)}`}
//             loading={loading}
//           />
//           <KPIStat
//             icon={Calendar}
//             label="Next Payment"
//             value={
//               nextDate
//                 ? nextDate.toLocaleDateString(undefined, {
//                     month: "short",
//                     day: "2-digit",
//                   })
//                 : "-"
//             }
//             loading={loading}
//           />
//         </div>

//         <MotionFadeIn>
//           <div className="tabs tabs-boxed bg-base-200 p-1 w-fit">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`tab tab-lg gap-2 ${
//                   activeTab === tab.id ? "tab-active" : ""
//                 }`}
//                 disabled={loading}>
//                 {tab.label}
//                 <div className="badge badge-sm">{tab.count}</div>
//               </button>
//             ))}
//           </div>
//         </MotionFadeIn>

//         <AnimatePresence mode="wait">
//           <div
//             key={activeTab + (loading ? "-loading" : "")}
//             className="space-y-6">
//             {loading ? (
//               Array.from({ length: 2 }).map((_, i) => (
//                 <LoanCard key={`skeleton-${i}`} loading index={i} />
//               ))
//             ) : loans.length ? (
//               loans.map((loan, idx) => (
//                 <LoanCard
//                   key={loan.id}
//                   loan={loan}
//                   index={idx}
//                   onView={handleView}
//                   onDownload={handleDownload}
//                   onPay={handlePay}
//                 />
//               ))
//             ) : (
//               <MotionFadeIn>
//                 <Card className="p-8 text-center rounded-lg shadow-sm">
//                   <div className="py-8">
//                     <DollarSign className="w-14 h-14 text-base-content/30 mx-auto mb-6" />
//                     <h3 className="text-2xl font-bold mb-2">
//                       No {activeTab} loans found
//                     </h3>
//                     <Text variant="muted">
//                       {activeTab === "active"
//                         ? "You don't have any active loans at the moment."
//                         : "You haven't completed any loans yet."}
//                     </Text>
//                   </div>
//                 </Card>
//               </MotionFadeIn>
//             )}
//           </div>
//         </AnimatePresence>
//       </div>
//     </DashboardLayout>
//   );
// }



import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Calendar, CreditCard, FileText } from "lucide-react";
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


export function MyLoans() {
  const { user } = useAuth(); // ✅ Only call inside a component
  const [loansData, setLoansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleView = (loan) => console.log("view", loan.id);
  const handleDownload = (loan) => console.log("download", loan.id);
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
                <div className="hidden md:block">
                  <input
                    className="input input-sm input-bordered max-w-xs"
                    placeholder="Search loans..."
                  />
                </div>
                <Button
                  variant="gradient"
                  size="md"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #84cc16, #22c55e)",
                    color: "white",
                  }}
                  disabled={loading}>
                  <FileText className="w-4 h-4" /> Export
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
                className={`tab tab-lg gap-2 ${activeTab === tab.id ? "tab-active" : ""
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
      </div>
    </DashboardLayout>
  );
}



