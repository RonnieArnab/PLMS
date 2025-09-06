const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const API_ROUTES = {
  base: API_BASE,
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/users/me",
  },
  // dashboard: {
  //   stats: "/dashboard/stats",
  //   applications: "/dashboard/applications",
  //   payments: "/dashboard/payments",
  //   portfolio: "/dashboard/portfolio",
  // },
  // loans: {
  //   list: "/loans",
  //   create: "/loans",
  //   payments: "/loans/payments",
  // },
};
