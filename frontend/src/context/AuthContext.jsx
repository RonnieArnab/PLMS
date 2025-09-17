// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import api, { setOnLogout } from "@api/api";
import { API_ROUTES } from "../config/apiRoutes";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // restoreSession running
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setOnLogout(() => {
      setUser(null);
      Cookies.remove("accessToken");
    });
  }, []);

  const setAccessToken = (accessToken) => {
    if (accessToken)
      Cookies.set("accessToken", accessToken, { sameSite: "strict" });
    else Cookies.remove("accessToken");
  };

  /**
   * signup
   * - backend creates user row and returns { user: { id, email, role, email_verified... } }
   * - does NOT return accessToken in the current backend implementation
   * - options.autoLogin: if true, set user state from returned user object
   */
  const signup = async (payload = {}, options = { autoLogin: true }) => {
    setAuthLoading(true);
    try {
      const res = await api.post(API_ROUTES.auth.signup, payload);
      const createdUser = res.data?.user ?? null;

      // backend doesn't currently return accessToken on signup
      if (options.autoLogin && createdUser) {
        setUser(createdUser);
      }

      setAuthLoading(false);
      return { ok: true, user: createdUser };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  const signupNoLogin = async (payload = {}) =>
    signup(payload, { autoLogin: false });

  /**
   * registerCustomer
   * - Calls /api/auth/register-customer (backend creates user if needed then customerprofile)
   * - Expects backend response: { user: {...}, customer: {...} }
   * - If backend returns accessToken (rare), we will set it — but we do not rely on it.
   */
  const registerCustomer = async (payload = {}) => {
    setAuthLoading(true);
    try {
      const res = await api.post(API_ROUTES.auth.registerCustomer, payload, {
        // If your backend sets cookies during registerCustomer, include credentials:
        // credentials are handled inside your `api` wrapper; if using fetch/axios ensure `withCredentials: true`
      });

      console.log(payload);
      const createdUser = res.data?.user ?? null;
      const customer = res.data?.customer ?? null;

      console.log(createdUser, customer);

      // If backend returns an accessToken (some flows might), set it
      const accessToken = res.data?.accessToken ?? null;
      if (accessToken) setAccessToken(accessToken);

      if (createdUser) setUser(createdUser);
      // If backend returned only customer, merge into user state
      else if (customer) setUser((u) => ({ ...(u || {}), ...customer }));

      setAuthLoading(false);
      return {
        ok: true,
        user: createdUser ?? (customer ? { ...customer } : null),
        customer,
      };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  /**
   * login
   * - expects { accessToken, user } from backend
   */
  const login = async (payload = {}) => {
    setAuthLoading(true);
    try {
      const res = await api.post(API_ROUTES.auth.login, payload);
      const { accessToken, user: loggedUser } = res.data || {};
      if (accessToken) setAccessToken(accessToken);
      setUser(loggedUser || null);
      setAuthLoading(false);
      return { ok: true, user: loggedUser };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  const logout = async () => {
    try {
      await api.post(API_ROUTES.auth.logout);
    } catch (e) {
      // ignore server error
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const fetchCustomer = async () => {
    setAuthLoading(true);
    try {
      const res = await api.get(API_ROUTES.customer.me);
      const payload = res.data || {};
      setAuthLoading(false);
      // backend could return { customer } or { user } or plain object
      const customer = payload.customer || payload.user || payload;
      return { ok: true, customer };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  const updateCustomer = async (payload = {}) => {
    setAuthLoading(true);
    try {
      const res = await api.patch(API_ROUTES.customer.me, payload);
      const data = res.data || {};
      if (data.user) setUser(data.user);
      else if (data.customer)
        setUser((u) => ({ ...(u || {}), ...data.customer }));
      setAuthLoading(false);
      return { ok: true, customer: data.customer ?? data.user ?? data };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  /**
   * restoreSession
   * - calls refresh endpoint, which returns 204 (no session) or { accessToken, user }
   */
  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post(API_ROUTES.auth.refresh);
      if (res.status === 204) {
        setUser(null);
        setAccessToken(null);
        setLoading(false);
        return { ok: true, user: null };
      } else {
        const { accessToken, user: u } = res.data || {};
        if (accessToken) setAccessToken(accessToken);
        setUser(u || null);
        setLoading(false);
        return { ok: true, user: u || null };
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value = {
    user,
    setUser,
    login,
    logout,
    signup,
    signupNoLogin,
    registerCustomer,
    fetchCustomer,
    updateCustomer,
    restoreSession,
    loading,
    authLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
