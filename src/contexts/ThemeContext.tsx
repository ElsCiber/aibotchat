import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeType = "purple" | "blue" | "green" | "red" | "orange";
type ModeType = "dark" | "light";

interface ThemeContextType {
  theme: ThemeType;
  mode: ModeType;
  setTheme: (theme: ThemeType) => void;
  setMode: (mode: ModeType) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Record<ThemeType, Record<ModeType, Record<string, string>>> = {
  purple: {
    dark: {
      "--background": "240 20% 8%",
      "--foreground": "240 10% 95%",
      "--card": "240 18% 12%",
      "--card-foreground": "240 10% 95%",
      "--popover": "240 18% 12%",
      "--popover-foreground": "240 10% 95%",
      "--primary": "250 70% 65%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "270 65% 70%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "240 15% 20%",
      "--muted-foreground": "240 10% 60%",
      "--accent": "260 75% 68%",
      "--accent-foreground": "0 0% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "240 15% 20%",
      "--input": "240 15% 20%",
      "--ring": "250 70% 65%",
      "--sidebar-background": "240 18% 10%",
      "--sidebar-foreground": "240 10% 95%",
      "--sidebar-primary": "250 70% 65%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "240 15% 15%",
      "--sidebar-accent-foreground": "240 10% 95%",
      "--sidebar-border": "240 15% 20%",
      "--sidebar-ring": "250 70% 65%",
      "--shadow-glow": "0 0 40px hsl(250 70% 65% / 0.3)",
      "--shadow-intense": "0 10px 40px -10px hsl(250 70% 65% / 0.5)",
      "--gradient-primary": "linear-gradient(135deg, hsl(250 70% 65%), hsl(270 65% 70%), hsl(260 75% 68%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(240 20% 8%), hsl(240 18% 12%))",
    },
    light: {
      "--background": "0 0% 100%",
      "--foreground": "240 10% 10%",
      "--card": "0 0% 98%",
      "--card-foreground": "240 10% 10%",
      "--popover": "0 0% 98%",
      "--popover-foreground": "240 10% 10%",
      "--primary": "250 70% 55%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "270 65% 60%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "240 5% 92%",
      "--muted-foreground": "240 5% 40%",
      "--accent": "260 75% 58%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 84.2% 50%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "240 5% 88%",
      "--input": "240 5% 88%",
      "--ring": "250 70% 55%",
      "--sidebar-background": "0 0% 96%",
      "--sidebar-foreground": "240 10% 10%",
      "--sidebar-primary": "250 70% 55%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "240 5% 90%",
      "--sidebar-accent-foreground": "240 10% 10%",
      "--sidebar-border": "240 5% 88%",
      "--sidebar-ring": "250 70% 55%",
      "--shadow-glow": "0 0 40px hsl(250 70% 55% / 0.2)",
      "--shadow-intense": "0 10px 40px -10px hsl(250 70% 55% / 0.3)",
      "--gradient-primary": "linear-gradient(135deg, hsl(250 70% 55%), hsl(270 65% 60%), hsl(260 75% 58%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 98%))",
    },
  },
  blue: {
    dark: {
      "--background": "220 20% 8%",
      "--foreground": "220 10% 95%",
      "--card": "220 18% 12%",
      "--card-foreground": "220 10% 95%",
      "--popover": "220 18% 12%",
      "--popover-foreground": "220 10% 95%",
      "--primary": "210 85% 60%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "200 80% 65%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "220 15% 20%",
      "--muted-foreground": "220 10% 60%",
      "--accent": "195 75% 70%",
      "--accent-foreground": "0 0% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "220 15% 20%",
      "--input": "220 15% 20%",
      "--ring": "210 85% 60%",
      "--sidebar-background": "220 18% 10%",
      "--sidebar-foreground": "220 10% 95%",
      "--sidebar-primary": "210 85% 60%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "220 15% 15%",
      "--sidebar-accent-foreground": "220 10% 95%",
      "--sidebar-border": "220 15% 20%",
      "--sidebar-ring": "210 85% 60%",
      "--shadow-glow": "0 0 40px hsl(210 85% 60% / 0.3)",
      "--shadow-intense": "0 10px 40px -10px hsl(210 85% 60% / 0.5)",
      "--gradient-primary": "linear-gradient(135deg, hsl(210 85% 60%), hsl(200 80% 65%), hsl(195 75% 70%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(220 20% 8%), hsl(220 18% 12%))",
    },
    light: {
      "--background": "0 0% 100%",
      "--foreground": "220 10% 10%",
      "--card": "0 0% 98%",
      "--card-foreground": "220 10% 10%",
      "--popover": "0 0% 98%",
      "--popover-foreground": "220 10% 10%",
      "--primary": "210 85% 50%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "200 80% 55%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "220 5% 92%",
      "--muted-foreground": "220 5% 40%",
      "--accent": "195 75% 60%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 84.2% 50%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "220 5% 88%",
      "--input": "220 5% 88%",
      "--ring": "210 85% 50%",
      "--sidebar-background": "0 0% 96%",
      "--sidebar-foreground": "220 10% 10%",
      "--sidebar-primary": "210 85% 50%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "220 5% 90%",
      "--sidebar-accent-foreground": "220 10% 10%",
      "--sidebar-border": "220 5% 88%",
      "--sidebar-ring": "210 85% 50%",
      "--shadow-glow": "0 0 40px hsl(210 85% 50% / 0.2)",
      "--shadow-intense": "0 10px 40px -10px hsl(210 85% 50% / 0.3)",
      "--gradient-primary": "linear-gradient(135deg, hsl(210 85% 50%), hsl(200 80% 55%), hsl(195 75% 60%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 98%))",
    },
  },
  green: {
    dark: {
      "--background": "160 20% 8%",
      "--foreground": "160 10% 95%",
      "--card": "160 18% 12%",
      "--card-foreground": "160 10% 95%",
      "--popover": "160 18% 12%",
      "--popover-foreground": "160 10% 95%",
      "--primary": "150 70% 55%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "140 65% 60%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "160 15% 20%",
      "--muted-foreground": "160 10% 60%",
      "--accent": "160 75% 65%",
      "--accent-foreground": "0 0% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "160 15% 20%",
      "--input": "160 15% 20%",
      "--ring": "150 70% 55%",
      "--sidebar-background": "160 18% 10%",
      "--sidebar-foreground": "160 10% 95%",
      "--sidebar-primary": "150 70% 55%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "160 15% 15%",
      "--sidebar-accent-foreground": "160 10% 95%",
      "--sidebar-border": "160 15% 20%",
      "--sidebar-ring": "150 70% 55%",
      "--shadow-glow": "0 0 40px hsl(150 70% 55% / 0.3)",
      "--shadow-intense": "0 10px 40px -10px hsl(150 70% 55% / 0.5)",
      "--gradient-primary": "linear-gradient(135deg, hsl(150 70% 55%), hsl(140 65% 60%), hsl(160 75% 65%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(160 20% 8%), hsl(160 18% 12%))",
    },
    light: {
      "--background": "0 0% 100%",
      "--foreground": "160 10% 10%",
      "--card": "0 0% 98%",
      "--card-foreground": "160 10% 10%",
      "--popover": "0 0% 98%",
      "--popover-foreground": "160 10% 10%",
      "--primary": "150 70% 45%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "140 65% 50%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "160 5% 92%",
      "--muted-foreground": "160 5% 40%",
      "--accent": "160 75% 55%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 84.2% 50%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "160 5% 88%",
      "--input": "160 5% 88%",
      "--ring": "150 70% 45%",
      "--sidebar-background": "0 0% 96%",
      "--sidebar-foreground": "160 10% 10%",
      "--sidebar-primary": "150 70% 45%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "160 5% 90%",
      "--sidebar-accent-foreground": "160 10% 10%",
      "--sidebar-border": "160 5% 88%",
      "--sidebar-ring": "150 70% 45%",
      "--shadow-glow": "0 0 40px hsl(150 70% 45% / 0.2)",
      "--shadow-intense": "0 10px 40px -10px hsl(150 70% 45% / 0.3)",
      "--gradient-primary": "linear-gradient(135deg, hsl(150 70% 45%), hsl(140 65% 50%), hsl(160 75% 55%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 98%))",
    },
  },
  red: {
    dark: {
      "--background": "0 20% 8%",
      "--foreground": "0 10% 95%",
      "--card": "0 18% 12%",
      "--card-foreground": "0 10% 95%",
      "--popover": "0 18% 12%",
      "--popover-foreground": "0 10% 95%",
      "--primary": "0 75% 65%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "10 70% 68%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "0 15% 20%",
      "--muted-foreground": "0 10% 60%",
      "--accent": "355 80% 70%",
      "--accent-foreground": "0 0% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "0 15% 20%",
      "--input": "0 15% 20%",
      "--ring": "0 75% 65%",
      "--sidebar-background": "0 18% 10%",
      "--sidebar-foreground": "0 10% 95%",
      "--sidebar-primary": "0 75% 65%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "0 15% 15%",
      "--sidebar-accent-foreground": "0 10% 95%",
      "--sidebar-border": "0 15% 20%",
      "--sidebar-ring": "0 75% 65%",
      "--shadow-glow": "0 0 40px hsl(0 75% 65% / 0.3)",
      "--shadow-intense": "0 10px 40px -10px hsl(0 75% 65% / 0.5)",
      "--gradient-primary": "linear-gradient(135deg, hsl(0 75% 65%), hsl(10 70% 68%), hsl(355 80% 70%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(0 20% 8%), hsl(0 18% 12%))",
    },
    light: {
      "--background": "0 0% 100%",
      "--foreground": "0 10% 10%",
      "--card": "0 0% 98%",
      "--card-foreground": "0 10% 10%",
      "--popover": "0 0% 98%",
      "--popover-foreground": "0 10% 10%",
      "--primary": "0 75% 55%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "10 70% 58%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "0 5% 92%",
      "--muted-foreground": "0 5% 40%",
      "--accent": "355 80% 60%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 84.2% 50%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "0 5% 88%",
      "--input": "0 5% 88%",
      "--ring": "0 75% 55%",
      "--sidebar-background": "0 0% 96%",
      "--sidebar-foreground": "0 10% 10%",
      "--sidebar-primary": "0 75% 55%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "0 5% 90%",
      "--sidebar-accent-foreground": "0 10% 10%",
      "--sidebar-border": "0 5% 88%",
      "--sidebar-ring": "0 75% 55%",
      "--shadow-glow": "0 0 40px hsl(0 75% 55% / 0.2)",
      "--shadow-intense": "0 10px 40px -10px hsl(0 75% 55% / 0.3)",
      "--gradient-primary": "linear-gradient(135deg, hsl(0 75% 55%), hsl(10 70% 58%), hsl(355 80% 60%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 98%))",
    },
  },
  orange: {
    dark: {
      "--background": "30 20% 8%",
      "--foreground": "30 10% 95%",
      "--card": "30 18% 12%",
      "--card-foreground": "30 10% 95%",
      "--popover": "30 18% 12%",
      "--popover-foreground": "30 10% 95%",
      "--primary": "30 85% 60%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "40 80% 65%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "30 15% 20%",
      "--muted-foreground": "30 10% 60%",
      "--accent": "25 90% 68%",
      "--accent-foreground": "0 0% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "30 15% 20%",
      "--input": "30 15% 20%",
      "--ring": "30 85% 60%",
      "--sidebar-background": "30 18% 10%",
      "--sidebar-foreground": "30 10% 95%",
      "--sidebar-primary": "30 85% 60%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "30 15% 15%",
      "--sidebar-accent-foreground": "30 10% 95%",
      "--sidebar-border": "30 15% 20%",
      "--sidebar-ring": "30 85% 60%",
      "--shadow-glow": "0 0 40px hsl(30 85% 60% / 0.3)",
      "--shadow-intense": "0 10px 40px -10px hsl(30 85% 60% / 0.5)",
      "--gradient-primary": "linear-gradient(135deg, hsl(30 85% 60%), hsl(40 80% 65%), hsl(25 90% 68%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(30 20% 8%), hsl(30 18% 12%))",
    },
    light: {
      "--background": "0 0% 100%",
      "--foreground": "30 10% 10%",
      "--card": "0 0% 98%",
      "--card-foreground": "30 10% 10%",
      "--popover": "0 0% 98%",
      "--popover-foreground": "30 10% 10%",
      "--primary": "30 85% 50%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "40 80% 55%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "30 5% 92%",
      "--muted-foreground": "30 5% 40%",
      "--accent": "25 90% 58%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 84.2% 50%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "30 5% 88%",
      "--input": "30 5% 88%",
      "--ring": "30 85% 50%",
      "--sidebar-background": "0 0% 96%",
      "--sidebar-foreground": "30 10% 10%",
      "--sidebar-primary": "30 85% 50%",
      "--sidebar-primary-foreground": "0 0% 98%",
      "--sidebar-accent": "30 5% 90%",
      "--sidebar-accent-foreground": "30 10% 10%",
      "--sidebar-border": "30 5% 88%",
      "--sidebar-ring": "30 85% 50%",
      "--shadow-glow": "0 0 40px hsl(30 85% 50% / 0.2)",
      "--shadow-intense": "0 10px 40px -10px hsl(30 85% 50% / 0.3)",
      "--gradient-primary": "linear-gradient(135deg, hsl(30 85% 50%), hsl(40 80% 55%), hsl(25 90% 58%))",
      "--gradient-dark": "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 98%))",
    },
  },
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("appTheme");
    return (saved as ThemeType) || "purple";
  });

  const [mode, setModeState] = useState<ModeType>(() => {
    const saved = localStorage.getItem("appMode");
    return (saved as ModeType) || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = themes[theme][mode];
    
    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    localStorage.setItem("appTheme", theme);
    localStorage.setItem("appMode", mode);
  }, [theme, mode]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: ModeType) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
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
