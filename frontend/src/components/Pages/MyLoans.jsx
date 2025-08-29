import React, { useMemo, useState } from "react";
import {
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { Card } from "../UI/Card";
import { Button } from "../UI/Button";

// --- helpers ---
const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);

// Simple EMI calculator (APR -> monthly rate)
const calcEmi = (principal, aprPct, months) => {
  if (!principal || !aprPct || !months) return 0;
  const r = aprPct / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
};

// --- MOCK: schema-like loans joined with product name ---
// Fields mirror your ERD names: loan_amount, interest_rate_apr, tenure_months,
// application_status, approved_amount, approved_date, disbursement_date, etc.
// product_name comes from LOANPRODUCTS join (for display).
const schemaLoans = [
  {
    loan_id: 1,
    product_id: 101,
    product_name: "Pro Equipment (Doctor)",
    loan_amount: 250000,
    tenure_months: 36,
    interest_rate_apr: 12.5,
    application_status: "approved",
    approved_amount: 240000,
    approved_date: "2025-08-01",
    disbursement_date: "2025-08-05",
    // dashboard-ish extras for UI:
    total_repaid: 18060, // mock till date
    remaining_balance: 221940, // mock
    next_due_date: "2025-09-15", // from REPAYMENTSCHEDULE (mock)
  },
  {
    loan_id: 2,
    product_id: 102,
    product_name: "Office Setup (Lawyer)",
    loan_amount: 75000,
    tenure_months: 24,
    interest_rate_apr: 13.0,
    application_status: "under_review",
    approved_amount: null,
    approved_date: null,
    disbursement_date: null,
    total_repaid: 0,
    remaining_balance: 0,
    next_due_date: null,
  },
  {
    loan_id: 3,
    product_id: 103,
    product_name: "Working Capital (Engineer)",
    loan_amount: 30000,
    tenure_months: 36,
    interest_rate_apr: 11.0,
    application_status: "disbursed",
    approved_amount: 30000,
    approved_date: "2022-11-25",
    disbursement_date: "2022-12-01",
    total_repaid: 33336,
    remaining_balance: 0,
    next_due_date: null,
    closed_date: "2023-11-30", // completed
  },
];

// Map schema rows -> UI rows while preserving previous design labels
const toUiLoan = (row) => {
  const principal = row.approved_amount ?? row.loan_amount;
  const emi = calcEmi(principal, row.interest_rate_apr, row.tenure_months);

  // Decide bucket
  const isActive = row.disbursement_date && (row.remaining_balance ?? 0) > 0;

  const isCompleted =
    row.disbursement_date && (row.remaining_balance ?? 0) === 0;

  return {
    // previous-design fields
    id: String(row.loan_id),
    purpose: row.product_name || "Loan Product",
    amount: principal,
    interestRate: row.interest_rate_apr,
    term: row.tenure_months,
    monthlyPayment: emi,
    totalRepaid: row.total_repaid ?? 0,
    remainingBalance: row.remaining_balance ?? 0,
    nextPaymentDate: row.next_due_date,
    disbursedAt: row.disbursement_date,
    completedAt: row.closed_date || null,
    status: isCompleted ? "completed" : isActive ? "active" : "pending",
    // keep originals if you need them later
    _raw: row,
  };
};

export const MyLoans = () => {
  // Transform schema-like loans to UI loans once
  const { activeLoans, completedLoans } = useMemo(() => {
    const ui = schemaLoans.map(toUiLoan);
    return {
      activeLoans: ui.filter((l) => l.status === "active"),
      completedLoans: ui.filter((l) => l.status === "completed"),
    };
  }, []);

  const [activeTab, setActiveTab] = useState("active");
  const loans = activeTab === "active" ? activeLoans : completedLoans;

  const tabs = [
    { id: "active", label: "Active Loans", count: activeLoans.length },
    { id: "completed", label: "Completed", count: completedLoans.length },
  ];

  const calculateProgress = (totalRepaid, amount) =>
    amount ? Math.round((totalRepaid / amount) * 100) : 0;

  // KPI cards (from active loans)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Loans
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your active and completed loans
          </p>
        </div>
      </div>

      {/* KPI Cards (design preserved, INR) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{inr(totalOutstanding)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monthly Payment
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{inr(totalMonthly)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Next Payment
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {nextDate
                  ? nextDate.toLocaleDateString("en-IN", {
                      month: "short",
                      day: "2-digit",
                    })
                  : "-"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs (design preserved) */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Loans List (design preserved, schema fields mapped) */}
      <div className="space-y-6">
        {loans.map((loan) => (
          <Card key={loan.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {loan.purpose}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Loan ID: {loan.id}
                  {loan.disbursedAt
                    ? ` • Disbursed: ${new Date(
                        loan.disbursedAt
                      ).toLocaleDateString()}`
                    : ``}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Statement
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loan Amount
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{inr(loan.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interest Rate
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {loan.interestRate}% APR
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Payment
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{inr(loan.monthlyPayment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {loan.status === "active"
                    ? "Remaining Balance"
                    : "Total Paid"}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹
                  {loan.status === "active"
                    ? inr(loan.remainingBalance)
                    : inr(loan.totalRepaid)}
                </p>
              </div>
            </div>

            {loan.status === "active" && (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Repayment Progress</span>
                    <span>
                      {calculateProgress(loan.totalRepaid, loan.amount)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${calculateProgress(
                          loan.totalRepaid,
                          loan.amount
                        )}%`,
                      }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Next Payment Due
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {loan.nextPaymentDate
                        ? new Date(loan.nextPaymentDate).toLocaleDateString()
                        : "-"}{" "}
                      • ₹{inr(loan.monthlyPayment)}
                    </p>
                  </div>
                  <Button>Make Payment</Button>
                </div>
              </>
            )}

            {loan.status === "completed" && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <FileText className="w-5 h-5 mr-2" />
                  <p className="font-medium">
                    Loan completed on{" "}
                    {new Date(loan.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {loans.length === 0 && (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No {activeTab} loans found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === "active"
              ? "You don't have any active loans at the moment."
              : "You haven't completed any loans yet."}
          </p>
        </Card>
      )}
    </div>
  );
};
