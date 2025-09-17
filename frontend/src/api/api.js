// // src/api/api.js
// import axios from "axios";
// import Cookies from "js-cookie";
// import { API_ROUTES } from "../config/apiRoutes";

// const api = axios.create({
//   baseURL: API_ROUTES?.base || "",
//   withCredentials: true,
//   headers: { "Content-Type": "application/json" },
// });

// // =====================
// // Logout hook mechanism
// // =====================
// let logoutHandler = null;
// export function setOnLogout(fn) {
//   logoutHandler = fn;
// }

// // attach token
// api.interceptors.request.use((config) => {
//   const token = Cookies.get("accessToken");
//   if (token) {
//     config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
//   }
//   return config;
// });

// /**
//  * Normalize error responses
//  */
// function normalizeError(err) {
//   if (!err || !err.response) {
//     return {
//       normalized: { general: err?.message || "Network error", fields: {} },
//     };
//   }

//   const { status, data } = err.response;
//   let general = null;
//   const fields = {};

//   if (data) {
//     if (typeof data.error === "string") general = data.error;
//     if (!general && typeof data.message === "string") general = data.message;

//     if (data.errors) {
//       if (Array.isArray(data.errors)) {
//         data.errors.forEach((it) => {
//           if (it.field && it.message) fields[it.field] = it.message;
//         });
//       } else if (typeof data.errors === "object") {
//         Object.entries(data.errors).forEach(([k, v]) => {
//           fields[k] = Array.isArray(v) ? v.join(" ") : String(v);
//         });
//       }
//     }
//   }

//   if (!general && Object.keys(fields).length === 0) {
//     general = `Request failed (${status})`;
//   }

//   return { normalized: { general, fields }, httpData: data, status };
// }

// // response interceptor
// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     const norm = normalizeError(err);

//     // ✅ If 401 → call global logout hook
//     if (err.response?.status === 401 && logoutHandler) {
//       logoutHandler();
//     }

//     err.normalized = norm;
//     return Promise.reject(err);
//   }
// );

// export default api;

////////////////////////////////////////////////////////////////////////////////////////
// src/api/api.js
import axios from "axios";
import Cookies from "js-cookie";
import { API_ROUTES } from "../config/apiRoutes";

/**
 * Build a safe base URL:
 * Priority:
 *  1. API_ROUTES.base
 *  2. Vite env var: import.meta.env.VITE_API_BASE
 *  3. Fallback to hardcoded localhost dev server host
 *
 * Guarantees the final baseURL contains a single `/api` prefix.
 */

function ensureNoTrailingSlash(s) {
  return s ? s.replace(/\/+$/, "") : s;
}

/**
 * Ensure the host string does NOT end with '/api' since individual routes already contain it.
 * - If host contains '/api' at the end, remove it.
 * - Otherwise return as is.
 */
function ensureNoApiPrefix(host) {
  if (!host) return host;
  const cleaned = ensureNoTrailingSlash(host);
  // If the host ends with '/api', remove it since routes already have '/api'
  return cleaned.replace(/\/api$/, "");
}

// Resolve configured base in priority order
const configured = API_ROUTES?.base || import.meta.env.VITE_API_BASE || "";
let host = configured ? configured.toString() : "";
if (!host) {
  // default for local dev (backend runs on port 4000)
  host = "http://localhost:4000";
}

// finalize baseURL - routes already have /api prefix
const baseURL = ensureNoApiPrefix(host);
console.log('API Base URL:', baseURL);

// Create axios instance
const api = axios.create({
  baseURL,
  withCredentials: true, // send cookies with cross-origin requests
  headers: { "Content-Type": "application/json" },
});

// =====================
// Logout hook mechanism
// =====================
let logoutHandler = null;
export function setOnLogout(fn) {
  logoutHandler = fn;
}

// attach token to every request if present
api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

/**
 * Normalize error responses into a consistent shape
 * - returns: { normalized: { general, fields }, httpData, status }
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

    // If 401 → call global logout hook (if set)
    if (err.response?.status === 401 && logoutHandler) {
      try {
        logoutHandler();
      } catch (e) {
        // swallow errors from logout handler
        // eslint-disable-next-line no-console
        console.error("logoutHandler error:", e);
      }
    }

    err.normalized = norm;
    return Promise.reject(err);
  }
);

export default api;
