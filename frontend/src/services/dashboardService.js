import api from "@api/api";
import { API_ROUTES } from "../config/apiRoutes";

// Fallback (your current static data)
const fallback = {
  stats: [
    { title: "Active Loans", value: 2 },
    { title: "Pending Applications", value: 1 },
    { title: "Total Borrowed", value: 125000 },
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

export async function fetchDashboardStats() {
  try {
    const { data } = await api.get(API_ROUTES.dashboard.stats);
    return data; // shape: [{ title, value }, ...]
  } catch {
    return fallback.stats;
  }
}

export async function fetchLoanApplications() {
  try {
    const { data } = await api.get(API_ROUTES.dashboard.applications);
    return data; // shape: [{ id, amount, purpose, status, submittedAt, interestRate }, ...]
  } catch {
    return fallback.applications;
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
