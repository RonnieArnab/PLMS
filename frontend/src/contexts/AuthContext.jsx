import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // login(email, password, role) unchanged
  const login = async (email, password, role) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const mockUser = {
      user_id: Math.random().toString(36).slice(2, 9),
      email,
      role, // "admin" | "applicant"
      phone_number: "9876543210",
      aadhaar_no: "123412341234",
      pan_no: "ABCDE1234F",
      profile: {
        full_name: role === "admin" ? "Admin User" : "John Doe",
        profession: role === "admin" ? "" : "Doctor",
        years_experience: 4,
        annual_income: 1200000,
        kyc_status: "pending",
        address: "",
      },
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    };

    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
    setLoading(false);
  };

  // register now accepts extra schema fields
  const register = async (
    email,
    password,
    name,
    profession,
    phone_number,
    aadhaar_no,
    pan_no
  ) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const mockUser = {
      user_id: Math.random().toString(36).slice(2, 9),
      email,
      role: "applicant",
      phone_number,
      aadhaar_no,
      pan_no,
      profile: {
        full_name: name,
        profession,
        years_experience: 0,
        annual_income: 0,
        kyc_status: "pending",
        address: "",
      },
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    };

    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
