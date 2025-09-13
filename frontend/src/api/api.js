// src/api/api.js
import axios from "axios";
import Cookies from "js-cookie";
import { API_ROUTES } from "../config/apiRoutes";

const api = axios.create({
  baseURL: API_ROUTES?.base || "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// =====================
// Logout hook mechanism
// =====================
let logoutHandler = null;
export function setOnLogout(fn) {
  logoutHandler = fn;
}

// attach token
api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

/**
 * Normalize error responses
 */
function normalizeError(err) {
  if (!err || !err.response) {
    return {
      normalized: { general: err?.message || "Network error", fields: {} },
    };
  }

  const { status, data } = err.response;
  let general = null;
  const fields = {};

  if (data) {
    if (typeof data.error === "string") general = data.error;
    if (!general && typeof data.message === "string") general = data.message;

    if (data.errors) {
      if (Array.isArray(data.errors)) {
        data.errors.forEach((it) => {
          if (it.field && it.message) fields[it.field] = it.message;
        });
      } else if (typeof data.errors === "object") {
        Object.entries(data.errors).forEach(([k, v]) => {
          fields[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
      }
    }
  }

  if (!general && Object.keys(fields).length === 0) {
    general = `Request failed (${status})`;
  }

  return { normalized: { general, fields }, httpData: data, status };
}

// response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const norm = normalizeError(err);

    // ✅ If 401 → call global logout hook
    if (err.response?.status === 401 && logoutHandler) {
      logoutHandler();
    }

    err.normalized = norm;
    return Promise.reject(err);
  }
);

export default api;
