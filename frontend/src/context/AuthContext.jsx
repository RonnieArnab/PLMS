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

  const signup = async (payload = {}, options = { autoLogin: true }) => {
    setAuthLoading(true);
    try {
      const res = await api.post(API_ROUTES.auth.signup, payload);
      const { accessToken, user: createdUser } = res.data || {};
      if (accessToken) setAccessToken(accessToken);
      if (options.autoLogin) setUser(createdUser || null);
      setAuthLoading(false);
      return {
        ok: true,
        user: options.autoLogin ? createdUser : null,
        accessToken,
      };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  const signupNoLogin = async (payload = {}) =>
    signup(payload, { autoLogin: false });

  const registerCustomer = async (payload = {}) => {
    setAuthLoading(true);
    try {
      const res = await api.post(API_ROUTES.customer.register, payload);
      const { accessToken, user: createdUser } = res.data || {};
      if (accessToken) setAccessToken(accessToken);
      if (createdUser) setUser(createdUser);
      setAuthLoading(false);
      return { ok: true, user: createdUser };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

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
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  // new: fetchCustomer -> GET /api/customer/me
  const fetchCustomer = async () => {
    setAuthLoading(true);
    try {
      const res = await api.get(API_ROUTES.customer.me);
      // expected { customer: {...} } or { user: {...} }
      const payload = res.data || {};
      setAuthLoading(false);
      // tolerate both shapes
      const customer = payload.customer || payload.user || payload;
      return { ok: true, customer };
    } catch (err) {
      setAuthLoading(false);
      return { ok: false, error: err.response?.data || err.message || err };
    }
  };

  // new: updateCustomer -> PATCH /api/customer/me
  const updateCustomer = async (payload = {}) => {
    setAuthLoading(true);
    try {
      const res = await api.patch(API_ROUTES.customer.me, payload);
      const data = res.data || {};
      // If backend returns updated user/customer, sync it into AuthContext
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

  // Refresh / restore session
  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post(API_ROUTES.auth.refresh);
      if (res.status === 204) {
        setUser(null);
        setAccessToken(null);
      } else {
        const { accessToken, user: u } = res.data || {};
        if (accessToken) setAccessToken(accessToken);
        setUser(u || null);
      }
    } catch (err) {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
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
