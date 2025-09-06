// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import api, { setOnLogout } from "../api/auth";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null if logged out
  const [loading, setLoading] = useState(true); // true until restoreSession runs

  // Provide a logout handler to axios interceptor
  useEffect(() => {
    setOnLogout(() => () => {
      setUser(null);
      Cookies.remove("accessToken");
      // no navigate here; do it where you call logout (eg Navbar)
    });
  }, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { accessToken, user: u } = res.data || {};
      if (accessToken) {
        Cookies.set("accessToken", accessToken, { sameSite: "strict" });
      }
      setUser(u || null);
      return { ok: true, user: u };
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      return { ok: false, error: err.response?.data || "Login failed" };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // ignore
    }
    setUser(null);
    Cookies.remove("accessToken");
    // Redirect in the caller (e.g., Navbar with useNavigate)
  };

  // RESTORE SESSION (run once)
  const restoreSession = async () => {
    try {
      // If server returns 204 when no cookie, this resolves w/ empty data
      const res = await api.post("/auth/refresh");
      const { accessToken, user: u } = res.data || {};
      if (accessToken) {
        Cookies.set("accessToken", accessToken, { sameSite: "strict" });
      }
      if (u) {
        setUser(u);
      } else {
        // If your refresh doesn't return user, you can fetch /users/me here:
        try {
          const me = await api.get("/users/me");
          setUser(me.data);
        } catch {
          setUser(null);
        }
      }
    } catch (err) {
      // No active session or refresh failed -> stay logged out
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { user, setUser, login, logout, restoreSession, api, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
