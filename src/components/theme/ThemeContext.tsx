"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "pink" | "blue" | "green" | "purple";

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  primaryHex: string;
  primaryGlow: string;
  bgHex: string;
  headerBgHex: string;
  borderHex: string;
  dotClass: string;
}

export const THEMES: Record<ThemeMode, ThemeConfig> = {
  pink: {
    id: "pink",
    name: "Rosa Neon",
    primaryHex: "#ec195a",
    primaryGlow: "rgba(236,25,90,0.8)",
    bgHex: "#090d16",
    headerBgHex: "#070a12",
    borderHex: "#1a2538",
    dotClass: "bg-[#ec195a]",
  },
  blue: {
    id: "blue",
    name: "Azul Cyber",
    primaryHex: "#00f0ff",
    primaryGlow: "rgba(0,240,255,0.8)",
    bgHex: "#030914",
    headerBgHex: "#040c1a",
    borderHex: "#0f2647",
    dotClass: "bg-[#00f0ff]",
  },
  green: {
    id: "green",
    name: "Verde Matrix",
    primaryHex: "#00ff87",
    primaryGlow: "rgba(0,255,135,0.8)",
    bgHex: "#020d08",
    headerBgHex: "#03140c",
    borderHex: "#0d331e",
    dotClass: "bg-[#00ff87]",
  },
  purple: {
    id: "purple",
    name: "Roxo Místico",
    primaryHex: "#c084fc",
    primaryGlow: "rgba(192,132,252,0.8)",
    bgHex: "#090412",
    headerBgHex: "#0c0518",
    borderHex: "#27123f",
    dotClass: "bg-[#c084fc]",
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  config: ThemeConfig;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "pink",
  config: THEMES.pink,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("pink");

  useEffect(() => {
    const saved = localStorage.getItem("larp_theme") as ThemeMode;
    if (saved && THEMES[saved]) {
      setThemeState(saved);
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("larp_theme", newTheme);
  };

  const config = THEMES[theme] || THEMES.pink;

  return (
    <ThemeContext.Provider value={{ theme, config, setTheme }}>
      <div
        style={
          {
            "--theme-primary": config.primaryHex,
            "--theme-glow": config.primaryGlow,
            "--theme-bg": config.bgHex,
            "--theme-border": config.borderHex,
          } as React.CSSProperties
        }
        className="min-h-screen"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
