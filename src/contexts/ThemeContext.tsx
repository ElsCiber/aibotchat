import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeType = "purple" | "blue" | "green" | "red" | "orange";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Record<ThemeType, Record<string, string>> = {
  purple: {
    "--primary": "250 70% 65%",
    "--secondary": "270 65% 70%",
    "--accent": "260 75% 68%",
    "--ring": "250 70% 65%",
    "--sidebar-primary": "250 70% 65%",
    "--sidebar-ring": "250 70% 65%",
    "--shadow-glow": "0 0 40px hsl(250 70% 65% / 0.3)",
    "--shadow-intense": "0 10px 40px -10px hsl(250 70% 65% / 0.5)",
    "--gradient-primary": "linear-gradient(135deg, hsl(250 70% 65%), hsl(270 65% 70%), hsl(260 75% 68%))",
  },
  blue: {
    "--primary": "210 85% 60%",
    "--secondary": "200 80% 65%",
    "--accent": "195 75% 70%",
    "--ring": "210 85% 60%",
    "--sidebar-primary": "210 85% 60%",
    "--sidebar-ring": "210 85% 60%",
    "--shadow-glow": "0 0 40px hsl(210 85% 60% / 0.3)",
    "--shadow-intense": "0 10px 40px -10px hsl(210 85% 60% / 0.5)",
    "--gradient-primary": "linear-gradient(135deg, hsl(210 85% 60%), hsl(200 80% 65%), hsl(195 75% 70%))",
  },
  green: {
    "--primary": "150 70% 55%",
    "--secondary": "140 65% 60%",
    "--accent": "160 75% 65%",
    "--ring": "150 70% 55%",
    "--sidebar-primary": "150 70% 55%",
    "--sidebar-ring": "150 70% 55%",
    "--shadow-glow": "0 0 40px hsl(150 70% 55% / 0.3)",
    "--shadow-intense": "0 10px 40px -10px hsl(150 70% 55% / 0.5)",
    "--gradient-primary": "linear-gradient(135deg, hsl(150 70% 55%), hsl(140 65% 60%), hsl(160 75% 65%))",
  },
  red: {
    "--primary": "0 75% 65%",
    "--secondary": "10 70% 68%",
    "--accent": "355 80% 70%",
    "--ring": "0 75% 65%",
    "--sidebar-primary": "0 75% 65%",
    "--sidebar-ring": "0 75% 65%",
    "--shadow-glow": "0 0 40px hsl(0 75% 65% / 0.3)",
    "--shadow-intense": "0 10px 40px -10px hsl(0 75% 65% / 0.5)",
    "--gradient-primary": "linear-gradient(135deg, hsl(0 75% 65%), hsl(10 70% 68%), hsl(355 80% 70%))",
  },
  orange: {
    "--primary": "30 85% 60%",
    "--secondary": "40 80% 65%",
    "--accent": "25 90% 68%",
    "--ring": "30 85% 60%",
    "--sidebar-primary": "30 85% 60%",
    "--sidebar-ring": "30 85% 60%",
    "--shadow-glow": "0 0 40px hsl(30 85% 60% / 0.3)",
    "--shadow-intense": "0 10px 40px -10px hsl(30 85% 60% / 0.5)",
    "--gradient-primary": "linear-gradient(135deg, hsl(30 85% 60%), hsl(40 80% 65%), hsl(25 90% 68%))",
  },
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("appTheme");
    return (saved as ThemeType) || "purple";
  });

  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = themes[theme];
    
    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
