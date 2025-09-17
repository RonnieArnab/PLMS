// src/config/apiRoutes.js
export const API_ROUTES = {
  base: "http://localhost:4000",
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    signup: "/api/auth/signup",
    // endpoint we added on the backend that creates user if needed + customer profile
    registerCustomer: "/api/auth/register-customer",
    // email verify link (GET) - helpful to have here
    verifyEmail: "/api/auth/verify-email",
  },
  customer: {
    // keep existing "me" paths if your backend exposes them (GET & PATCH)
    register: "/api/customer/register", // legacy - do not use if you use auth.registerCustomer
    me: "/api/customer/me", // GET & PATCH for profile (ensure these exist on server)
  },
  kyc: {
    aadhaar: "/api/kyc/aadhaar",
    pan: "/api/kyc/pan",
    downloadXml: (fileId) => `/api/kyc/download-xml/${fileId}`,
  },
  dashboard: {
    stats: "/api/dashboard/stats",
    applications: "/api/dashboard/applications",
    payments: "/api/dashboard/payments",
    portfolio: "/api/dashboard/portfolio",
  },
  payments: {
    getByUser: (userId) => `/api/payments/user/${userId}`,
    getByLoan: (loanId) => `/api/payments/loan/${loanId}`,
    getPaymentHistory: (loanId) => `/api/payments/history?loan_id=${loanId}`,
    recordPayment: "/api/payments",
    createOrder: "/api/payments/order",
    createSubscription: "/api/payments/subscription",
    verifyPayment: "/api/payments/verify",
    verifySubscription: "/api/payments/verify-subscription",
    exportStatements: (userId) => `/api/payments/export/${userId}`,
  },
  repayments: {
    getAll: "/api/repayments",
    getByUser: (userId) => `/api/repayments/user/${userId}`,
    getByLoan: (loanId) => `/api/repayments/loan/${loanId}`,
    getNext: (loanId) => `/api/repayments/next/${loanId}`,
    create: "/api/repayments",
  },
  loans: {
    getAll: "/api/loan-applications",
    getByUser: (userId) => `/api/loan-applications/user/${userId}`,
    getById: (loanId) => `/api/loan-applications/${loanId}`,
    create: "/api/loan-applications",
    update: (loanId) => `/api/loan-applications/${loanId}`,
  },
  loanProducts: {
    getAll: "/api/loan-products",
    getById: (productId) => `/api/loan-products/${productId}`,
  },
};
