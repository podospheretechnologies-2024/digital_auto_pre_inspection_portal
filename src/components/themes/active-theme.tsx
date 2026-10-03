"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { DEFAULT_THEME, THEME_COOKIE } from "./theme.config";

function setThemeCookie(theme: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${
    window.location.protocol === "https:" ? "Secure;" : ""
  }`;
}

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const [activeTheme, setActiveTheme] = useState(initialTheme || DEFAULT_THEME);

  useEffect(() => {
    setThemeCookie(activeTheme);
    document.documentElement.setAttribute("data-theme", activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider");
  }
  return context;
}
