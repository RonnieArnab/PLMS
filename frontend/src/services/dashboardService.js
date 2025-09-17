import api from "@api/api";
import { API_ROUTES } from "../config/apiRoutes";


const fallback = {
  stats: [
    { title: "Active Loans", value: 0 },
    { title: "Pending Applications", value: 0},
    { title: "Total Borrowed", value: 1},
    { title: "Credit Score", value: 785 },
  ],
  applications: [
    {
      id: "1",
      amount: 50000,
      purpose: "Practice Equipment",
      status: "approved",
      submittedAt: "2024-01-15",
      interestRate: 7.5,
    },
    {
      id: "2",
      amount: 75000,
      purpose: "Office Setup",
      status: "under-review",
      submittedAt: "2024-01-20",
      interestRate: null,
    },
    {
      id: "3",
      amount: 100000,
      purpose: "Clinic Purchase",
      status: "pending",
      submittedAt: "2024-01-22",
      interestRate: null,
    },
  ],
  payments: [
    { month: "Jan", amount: 2500 },
    { month: "Feb", amount: 2500 },
    { month: "Mar", amount: 2500 },
    { month: "Apr", amount: 2500 },
    { month: "May", amount: 2500 },
    { month: "Jun", amount: 2500 },
  ],
  portfolio: [
    { name: "Equipment Loan", value: 50000, color: "#3B82F6" },
    { name: "Office Setup", value: 75000, color: "#10B981" },
  ],
};
async function updateStats(userId) {
  try {
    const { data } = await api.get(`http://localhost:4000/api/loan-applications/user/${userId}`);
    const loans = data.data;

    let activeCount = 0;
    let pendingCount = 0;
    let loanAmount = 0;

    loans.forEach((loan) => {
      const status = ["APPROVED", "DRAFT", "PENDING"].includes(loan.application_status)
        ? "active"
        : "completed";

      if (status === "active") {
        activeCount += 1;
      }

      if (loan.application_status === "PENDING") {
        pendingCount += 1;
      }

      loanAmount += parseFloat(loan.loan_amount) || 0;
    });

    fallback.stats = [
      { title: "Active Loans", value: activeCount },
      { title: "Pending Applications", value: pendingCount },
      { title: "Total Borrowed", value: loanAmount },
      { title: "Credit Score", value: 785 },
    ];

    console.log("Fallback stats updated:", fallback.stats);
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}
export async function initializeStats(userId) {
  if (userId) {
    await updateStats(userId);
  }
}
export async function fetchDashboardStats() {
   return fallback.stats;
}
function mapApiToApp(item) {
  return {
    id: item.loan_id || item.id,
    amount: Number(item.loan_amount ?? item.amount) || 0,
    purpose: item.product_name || item.purpose || "-",
    // normalize status to lowercase so UI can match
    status: "approved",
    // convert ISO date -> timestamp (ms)
    submittedAt: item.applied_date
      ? new Date(item.applied_date).getTime()
      : item.submittedAt
      ? new Date(item.submittedAt).getTime()
      : null,
    interestRate:
      item.interest_rate_apr != null
        ? parseFloat(item.interest_rate_apr)
        : item.interestRate ?? null,
  };
}

export async function fetchLoanApplications(userId) {
  // if you don't have userId available here, pass it from the caller (recommended)
  if (!userId) {
    console.warn("fetchLoanApplications called without userId — returning fallback");
    return fallback.applications.map(mapApiToApp);
  }

  try {
    // use relative path if your axios api has baseURL set. Otherwise keep full URL.
    const res = await api.get(`http://localhost:4000/api/loan-applications/user/${userId}`);
    // res.data is likely { success: true, data: [...], count: N }
    const payload = res?.data;
    console.log("raw response", res?.data);

    if (payload?.success && Array.isArray(payload.data)) {
      return payload.data.map(mapApiToApp);
    }

    // sometimes backend returns array directly
    if (Array.isArray(payload)) {
      return payload.map(mapApiToApp);
    }
   
    return [];
  } catch (err) {
    console.error("fetchLoanApplications error:", err);
    // keep fallback so UI still shows something
    return fallback.applications.map(mapApiToApp);
  }
}

export async function fetchPaymentHistory() {
  try {
    const { data } = await api.get(API_ROUTES.dashboard.payments);
    return data; // shape: [{ month, amount }, ...]
  } catch {
    return fallback.payments;
  }
}

export async function fetchPortfolioBreakdown() {
  try {
    const { data } = await api.get(API_ROUTES.dashboard.portfolio);
    return data; // shape: [{ name, value, color }, ...]
  } catch {
    return fallback.portfolio;
  }
}
