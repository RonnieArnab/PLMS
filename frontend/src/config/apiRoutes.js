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
};
