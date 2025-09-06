// src/context/ThemeContext.jsx
import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// safe localStorage helpers
const safeGet = (key) => {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    if (typeof window === "undefined") return;
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* ignore (private mode) */
  }
};

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const ThemeProvider = ({ children }) => {
  // Initialize: stored "dark"|"light" or system preference
  const [isDark, setIsDark] = useState(() => {
    const stored = safeGet("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return prefersDark();
  });

  // Apply the class before paint to reduce FOUC
  useLayoutEffect(() => {
    const root = typeof document !== "undefined" ? document.documentElement : null;
    if (!root) return;
    
    // Apply both class and data-theme for daisyUI compatibility
    root.classList.toggle("dark", !!isDark);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // API: setTheme writes immediately and updates state
  const setTheme = (mode) => {
    if (mode !== "dark" && mode !== "light") return;
    safeSet("theme", mode);
    setIsDark(mode === "dark");
  };

  const toggleTheme = () => {
    const next = !isDark;
    safeSet("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <ThemeContext.Provider value={{ isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
