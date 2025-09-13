// src/config/apiRoutes.js
export const API_ROUTES = {
  base: "http://localhost:4000",
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    signup: "/api/auth/signup",
  },
  customer: {
    register: "/api/customer/register",
    me: "/api/customer/me", // GET & PATCH for profile
    // legacy combined endpoint removed — frontend now calls /api/kyc directly
    // kyc: "/api/customer/kyc",
  },
  kyc: {
    aadhaar: "/api/kyc/aadhaar",
    pan: "/api/kyc/pan",
    downloadXml: (fileId) => `/api/kyc/download-xml/${fileId}`,
  },
};

